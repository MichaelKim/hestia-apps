const alphabet = document.getElementById('alphabet');
const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
rows.forEach(row => {
  const rowBox = document.createElement('div');
  for (let char of row) {
    const key = document.createElement('button');
    key.className = 'alphabet-key';
    key.innerHTML = char;

    key.onclick = () => {
      app.emit('pickedLetter', char.charCodeAt() - 65);
    };
    rowBox.appendChild(key);
  }
  alphabet.appendChild(rowBox);
});

const instBtn = document.getElementById('inst-btn');
const instBox = document.getElementById('inst-box');
instBtn.onclick = () => {
  instBox.style.display = instBox.style.display === 'block' ? 'none' : 'block';
};

const callOutBtn = document.getElementById('call-out');
const wordBox = document.getElementById('word-box');
const timer = document.getElementById('timer');
const currString = document.getElementById('curr-string');
const statusBox = document.getElementById('status-box');
const enterWord = document.getElementById('enter');
let timeout = null;
let timeoutEnd = null;

app.on('round-start', (name, timeLimit, myTurn) => {
  if (myTurn) {
    setStatus("It's your turn! You have " + timeLimit / 1000 + ' seconds to pick a letter.');
  } else {
    setStatus("It's " + name + "'s turn! They have " + timeLimit / 1000 + ' seconds to pick a letter.');
  }
  setString('');
  setTime(timeLimit);
});

app.on('round-end', (status, name, lost) => {
  if (lost) {
    setStatus('You lost! Round ended by ' + status + '. New round in 5 sec...');
  } else {
    setStatus(name + ' lost! Round ended by ' + status + '. New round in 5 sec...');
  }
  setTime(0);
  wordBox.disabled = true;
});

app.on('new-letter', (str, name, timeLimit, myTurn) => {
  if (myTurn) {
    setStatus("It's your turn! Pick a letter! You have " + timeLimit / 1000 + ' seconds!');
  } else {
    setStatus("It's " + name + "'s turn! They have " + timeLimit / 1000 + ' seconds!');
  }
  setString(str);
  setTime(timeLimit);
});

app.on('called-out', (timeLimit, name, myTurn) => {
  if (myTurn) {
    setStatus("You got called out! What's your word? You have " + timeLimit / 1000 + ' seconds');
    wordBox.disabled = false;
  } else {
    setStatus(name + ' got called out! They have ' + timeLimit / 1000 + ' seconds to enter their word.');
  }
  setTime(timeLimit);
});

callOutBtn.onclick = () => {
  app.emit('calledOut');
};

wordBox.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    app.emit('calledOutReply', wordBox.value);
  }
});

enterWord.onclick = () => app.emit('calledOutReply', wordBox.value);

function setStatus(text) {
  statusBox.value = text + '\n' + statusBox.value;
}

function setString(str) {
  currString.innerHTML = 'Current string: ' + str;
}

function setTime(limit) {
  clearInterval(timeout);
  clearTimeout(timeoutEnd);

  const startTime = Date.now();
  timeout = setInterval(() => {
    const percent = 100 - ((Date.now() - startTime) * 100) / limit;
    timer.style.background =
      'linear-gradient(to right, red, red ' + percent + '%, transparent ' + percent + '%, transparent 100%)';
  }, 100);

  timeoutEnd = setTimeout(() => {
    clearInterval(timeout);
  }, limit);
}

/*
Start:
- Server to all
  - "round-start", name of starting player, bool if it's the player's turn

If time limit is up:
- Server to all
  - "round-end", result of game (did you lose, name of losing player, lost by time limit)
  - In 5 seconds, reset round

If player enters letter:
- Client to server
  - "pickedLetter", letter picked (0 - 25)
  - Server
    - Checks for valid move
  - Server to all
    - "new-letter", send current string, name of next player, bool if it's the player's turn

If player presses "Call Out":
- Client to server
  - "calledOut"
- Server to all
  - "called-out", time limit, who called out who, bool if the player got called out
- Called out client
  - Enable word box
  - On word box enter:
    - To server
      - "called-out-reply", word
      - If valid word:
        - Caller loses
      - If not valid word:
        - Callee loses
  - If time runs out (10 seconds):
    - Callee loses
    - Server to all
      - "round-end", result of game
      - In 5 seconds, reset round
*/
