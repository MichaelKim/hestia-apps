const fs = require('fs');
const path = require('path');

function serverApp(app) {
  let playerOrder = []; // Player ids currently in game
  let playersToAdd = []; // New player ids that entered during game
  let currPlayer = null; // Player index that is currently making move
  let startTime = null; // Starting time of move
  let startRoundCb = null; // Callback to start round
  let outOfTime = null; // Callback when move out of time
  let bluffOutOfTime = null; // Callback when out of time for answering call out
  let currString = ''; // Current created string
  const timeLimit = 30 * 1000; // Length of move (30 sec)
  const bluffLimit = 10 * 1000; // Length of bluff (10 sec)

  const STATUS = Object.freeze({
    TIMEOUT: 'timeout', // ran out of time
    CALLOUT: 'callout success', // called out for incorrect word
    BLUFF: 'callout failed' // called out for correct word
  });

  app.onload = function() {
    // Add all starting players
    for (let id in app.players) {
      playerOrder.push(id);
    }

    // First player makes first move
    currPlayer = 0;
    startRound();
  };

  app.on('pickedLetter', function(id, letter) {
    // Only current player can make move
    if (id !== playerOrder[currPlayer]) return;

    // Must be valid letter
    if (letter && (letter < 0 || letter > 25)) return;

    // Check time limit
    if (Date.now() - startTime > timeLimit) return;

    // Valid move
    currString += String.fromCharCode(65 + letter);
    currPlayer = (currPlayer + 1) % playerOrder.length;
    clearTimeout(outOfTime);
    startTime = Date.now();
    outOfTime = setTimeout(roundEnd, timeLimit);

    const nextID = playerOrder[currPlayer];
    const nextName = app.players[nextID].name;

    playerOrder.forEach(pid => {
      app.emit(pid, 'new-letter', currString, nextName, timeLimit, pid === nextID);
    });
  });

  app.on('calledOut', function(id) {
    // First player cannot call out
    if (currString === '') return;

    // Someone is being called out
    if (bluffOutOfTime) return;

    if (validWord(currString)) {
      currPlayer = (currPlayer + playerOrder.length - 1) % playerOrder.length;
      roundEnd(STATUS.CALLOUT);
      return;
    }

    // Get previous player
    const prevID = playerOrder[(currPlayer + playerOrder.length - 1) % playerOrder.length];
    const prevName = app.players[prevID].name;

    playerOrder.forEach(pid => app.emit(pid, 'called-out', bluffLimit, prevName, pid === prevID));

    bluffOutOfTime = setTimeout(() => {
      // Switch player lost
      currPlayer = (currPlayer + playerOrder.length - 1) % playerOrder.length;
      roundEnd(STATUS.CALLOUT);
    }, bluffLimit);
  });

  app.on('calledOutReply', function(id, word) {
    // No one is called out right now
    if (!bluffOutOfTime) return;

    clearTimeout(bluffOutOfTime);
    if (validWord(word) && word.startsWith(currString)) {
      roundEnd(STATUS.BLUFF);
    } else {
      currPlayer = (currPlayer + playerOrder.length - 1) % playerOrder.length;
      roundEnd(STATUS.CALLOUT);
    }
  });

  function startRound() {
    currString = '';
    outOfTime = setTimeout(roundEnd, timeLimit);
    startTime = Date.now();

    const currID = playerOrder[currPlayer];
    const currName = app.players[currID].name;

    startRoundCb = setTimeout(() => {
      playerOrder.forEach(pid => {
        app.emit(pid, 'round-start', currName, timeLimit, pid === currID);
      });
    }, 1000);
  }

  function roundEnd(status) {
    // End round
    clearTimeout(outOfTime);

    const currID = playerOrder[currPlayer];
    const currName = app.players[currID].name;

    playerOrder.forEach(pid => {
      app.emit(pid, 'round-end', status || STATUS.TIMEOUT, currName, pid === currID);
    });

    setTimeout(() => {
      playerOrder = playerOrder.concat(playersToAdd);
      playersToAdd = [];
      startRound();
    }, 5 * 1000);
  }

  function validWord(word) {
    const content = fs.readFileSync(path.resolve(__dirname, './english.txt'));
    const regex = new RegExp('\n' + word.toLowerCase() + '\n');
    return content.toString('utf-8').match(regex);
  }

  app.left = function(id) {
    const orderIndex = playerOrder.indexOf(id);
    if (orderIndex > -1) playerOrder.splice(orderIndex, 1);

    const addIndex = playersToAdd.indexOf(id);
    if (addIndex > -1) playersToAdd.splice(addIndex, 1);
  };

  app.quit = function() {
    clearTimeout(outOfTime);
    clearTimeout(bluffOutOfTime);
    clearTimeout(startRoundCb);
  };

  return app;
}

module.exports = serverApp;
