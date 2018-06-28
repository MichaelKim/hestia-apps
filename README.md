# hestia-apps

## Features

Hestia Apps is a library that manages instances of multi-user apps.

It consists of

- A Node.js server (this repository)
- A Javascript client library

## Installation

    npm install --save hestia-apps

## Usage

Hestia manages sockets with Socket.IO, and has a similar interface for handling events. The main difference is that the socket which triggered the event is sent as the first argument to the handler function.

```js
const http = require('http').createServer();
const h = require('hestia-apps')(http, __dirname);

h.on('join', function(socket, data) {
  var roomID = h.createRoom();
  h.addPlayer({});
  socket.emit('joined');
});

http.listen(5000);
```

## Documentation

Check out the full documentation [here](https://github.com/LenKagamine/hestia-apps/wiki).

## License

[MIT](https://github.com/LenKagamine/hestia-apps/blob/master/LICENSE)
