var express = require("express");
var app     = express();
var comp    = require("compression");
var http    = require("http").createServer(app);
var io      = require("socket.io").listen(http);

var appNames = ['Add1', 'Canvas', 'Chat', 'Connect4', 'Ping', 'Quiz'];
var roomApps = []; //0-9999 corresponding to room id

var hestia;

io.on("connection", function(socket) {
    hestia = socket;
    console.log("CONNECTION: " + socket.id);
    socket.emit("appNames", appNames);

    socket.on("selectApp", function(roomId, appId, players) {
        selectApp(roomId, appId, players);
    });

    socket.on("joinApp", function(roomId, socketId, player) {
        joinApp(roomId, socketId, player);
    });

    socket.on("dataRetrieved", function(roomId, socketId, eventName, data) {
        dataRetrieved(roomId, socketId, eventName, data);
    });

    socket.on("leaveApp", function(roomId, socketId) {
        leaveApp(roomId, socketId);
    });

    socket.on("quitApp", function(roomId) {
        quitApp(roomId);
    })

    socket.on("disconnect", function() {
        console.log("DISCONNECTION: " + socket);
    });
});

function selectApp(roomId, appId, players) {
    var app = {
        players: players, //[ID: { name: NAME, role: ROLE }]

        ons: [],

        on: function(){
            console.log("APP ON");
            console.log(arguments);
            var args = Array.prototype.slice.call(arguments);
            console.log(args);
            this.ons[args[0]] = args[1];
        },

        emit: function(){
            console.log("APP EMIT");
            console.log(arguments);
            var args = Array.prototype.slice.call(arguments);
            var socketId = args[0];
            var eventName = args[1];
            var data = args.slice(2);
            console.log(args);
            hestia.emit("apps-emit", socketId, eventName, data);
        },

        emitAll: function(){
            var args = Array.prototype.slice.call(arguments);
            var eventName = args[0];
            var data = args.slice(1);
            hestia.emit("apps-emit-all", eventName, data, players);
        },

        execute: function(eventName, socketId, data){
            data.unshift(socketId);
            (this.ons[eventName]).apply(this.ons[eventName], data);
        },

        joined: function(id, name, role) {
            console.log(id + ", " + name + " joined, role: " + role);
        },

        left: function(id, name, role) {
            console.log(id + ", " + name + " left, role: " + role);
        },

        onload: function() {
            console.log('onload');
        },

        connect: function() {
            return [];
        }
    };
    app.on("_onload", function(socket) {
        var names = [];
        for(var id in app.players) {
            console.log(id);
            names.push(app.players[id].name);
        }
        var data = app.connect();
        app.emit(socket, "_connected", names, data);
    });

    var newApp = new (require("./apps/server/" + appNames[appId] + "/server.js"))(app); //create new instance of server.js, not singleton
    console.log(newApp);
    newApp.onload();
    roomApps[roomId] = newApp;
}

function joinApp(roomId, socketID, player) {
    roomApps[roomId].players[socketID] = player;

    roomApps[roomId].joined(socketID, player.name, player.role);
}

function dataRetrieved(roomId, socketId, eventName, data) {
    //console.log("appManager.dataRetrieved: " + eventName + "; " + data + "; " + roomId);

    roomApps[roomId].execute(eventName, socketId, data);
}

function leaveApp(roomId, socketId) { //player leaves app
    var player = roomApps[roomId].players[socketId];
    delete roomApps[roomId].players[socketId];
    roomApps[roomId].left(socketId, player.name, player.role);
    // remove player from app.players
    // roomApps[roomId].players
    // call some method in app like app.joined / app.left
}

function quitApp(roomId) { //host leaves app
    console.log("room " + roomId + " quitting app");
    delete roomApps[roomId];
}

app.use(comp());
app.get('/names', function(req, res, next) {
    res.send(appNames);
});
app.use(function(req, res, next) {
    console.log(req.path);
    console.log(req.path.split('/')[1]);
    var name = req.path.split('/')[1];
    if(appNames.indexOf(name) === -1 && name !== 'appHeader.js') {
        res.send("No app found");
    }
    else {
        next();
    }
});

app.use(express.static(__dirname + "/apps/client"));
var port = process.env.PORT || 4000;
http.listen(port, function(){
  console.log("listening on:" + port);
});
