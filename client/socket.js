function setupSocket(socket) {
  socket.on('error-msg', function(message) {
    showError(message);
  });

  socket.on('room-created', function(newId, appNames) {
    console.log('Created room: ' + newId);
    setRoom(newId);
    setRole(0);
    setApp(-1);
    waiting.innerHTML = 'Pick an App to Run';
    loadAppsList(appNames);
  });

  socket.on('room-joined', function(newId, appNames) {
    console.log('Joined room: ' + newId);
    setRoom(newId);
    setRole(1);
    setApp(-1);
    waiting.innerHTML = 'Waiting for Host to Pick';
    loadAppsList(appNames);
  });

  socket.on('app-changed', function(appId, appName) {
    console.log('app changed to ' + appId);
    setApp(appId);
    loadApp(appName);
    waiting.innerHTML = 'Loading app';
  });

  socket.on('role-changed', function(role) {
    console.log('changed role: ' + role);
    setRole(role);
  });

  socket.on('leave-app', function(appNames) {
    loadAppsList(appNames);
    waiting.innerHTML = 'Pick an App to Run';
    leaveApp();
  });

  socket.on('leave-room', function() {
    leaveRoom();
  });

  socket.on('disconnect', function() {
    leaveRoom();
  });
}
