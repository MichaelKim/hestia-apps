# hestia-apps

## Features

Hestia Apps

It consists of

- A Node.js server (this repository)
- A Javascript client library

## Installation

    npm install --save hestia-apps

## How to use

```js
const http = require('http').createServer();
const h = require('hestia-apps')(http, __dirname);
```
