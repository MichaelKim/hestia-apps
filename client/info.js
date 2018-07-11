/* Info panel */
var roomInfo = document.getElementById('room-info');
var roleInfo = document.getElementById('role-info');
var appInfo = document.getElementById('app-info');

/* Error message */
var errorInterval;
var error = document.getElementById('error');

/* Display utils */
var header = document.getElementById('header-title');
var wrapper = document.getElementById('wrapper');
var hestiaBox = document.getElementById('hestia-box');

/* Info panel functions */
function setRoom(room) {
  roomInfo.innerHTML = 'Room: ' + room;
}

function setRole(role) {
  console.log('set role: ' + role);
  var roleStr = 'N/A';
  if (role === 0) roleStr = 'Host';
  else if (role === 1) roleStr = 'Player';
  else if (role === 2) roleStr = 'Spectator';
  roleInfo.innerHTML = 'Role: ' + roleStr;
}

function setApp(app) {
  appInfo.innerHTML = 'App: ' + (app < 0 ? 'N/A' : app);
}

function showError(message) {
  error.innerHTML = 'Error: ' + message;
  if (errorInterval) {
    clearTimeout(errorInterval);
  }
  errorInterval = setTimeout(function() {
    error.innerHTML = '';
  }, 2000);
}

/* App list functions  */

function loadAppsList(appNames) {
  console.log(appNames);
  wrapper.style.display = 'block';
  header.style.display = 'none';

  var applist = document.getElementById('app-list');

  while (applist.firstChild) {
    applist.removeChild(applist.firstChild);
  }

  for (var i = 0; i < appNames.length; ++i) {
    applist.appendChild(createAppButton(appNames[i], i));
  }
}

function createAppButton(name, index) {
  var newbtn = document.createElement('button');
  newbtn.innerHTML = name;
  newbtn.onclick = function() {
    console.log('select app ' + index);
    socket.emit('selectApp', index);
  };
  return newbtn;
}

/* App related methods */

function loadApp(appName) {
  wrapper.style.display = 'none';
  hestiaBox.style.display = 'block';
}

function leaveApp() {
  console.log('Back to apps');
  wrapper.style.display = 'block';
  header.style.display = 'none';
  hestiaBox.style.display = 'none';

  setApp(-1);
}

function leaveRoom() {
  console.log('Back to main');
  if (screenfull.enabled) {
    screenfull.exit();
  }
  wrapper.style.display = 'none';
  header.style.display = 'block';
  hestiaBox.style.display = 'none';

  setApp(-1);
  setRole(-1);
  setRoom('N/A');
}
