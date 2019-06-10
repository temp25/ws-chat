"use strict";

process.title = "websocket-node-chat";

var webSocketServerPort = 2573;

var webSocketServer = require("websocket").server;
var http = require('http');
var fileSystem = require('fs');

var history = [];
var clients = [];

function htmlEntities(str) {
    return String(str)
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;");
}

var colors = [
    "red",
    "green",
    "blue",
    "magenta",
    "purple",
    "plum",
    "orange"
];

colors.sort(function(a,b){
    return Math.random() > 0.5;
});

var server = http.createServer(function(request, response) {

    console.log("request.url : "+request.url);

    if (request.url === "/" || request.url === "/index.html") {
        serveFile(response, "./index.html", "text/html");
    } else if (request.url === "/main.css") {
        serveFile(response, "."+request.url, "text/css");
    } else if (request.url === "/jquery-3.4.1.min.js") {
        serveFile(response, "."+request.url, "text/javascript");
    } else if (request.url === "/main.js") {
        serveFile(response, "."+request.url, "text/javascript");
    } else if (request.url === "/favicon.ico") {
        serveFile(response, "."+request.url, "image/x-icon");
    } else {
        //TODO: Handle error 404 File not found
    }

});

server.listen(webSocketServerPort, function(){
    console.log((new Date())+"\nServer is listening on port "+webSocketServerPort+"\n");
});

var wsServer=new webSocketServer({
    httpServer: server
});

wsServer.on("request", function(request){
    console.log((new Date())+"Connection from origin "+request.origin+".");
    var connection = request.accept(null, request.origin);
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;
    console.log((new Date())+"Connection accepted");
    if(history.length > 0){
        connection.sendUTF(JSON.stringify({
            type: "history",
            data: history
        }));
    }

    connection.on("message", function(message) {
        //console.log("on message triggered. message.type : "+message.type);
        if (message.type === "utf8") {
            if (userName === false) {
                userName = htmlEntities(message.utf8Data);
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({
                    type: "color",
                    data: userColor
                }));
                console.log((new Date())+"User is known as: "+userName+" with "+userColor+" color.");
            } else {
                console.log((new Date())+"Received message from "+userName+" : "+message.utf8Data);
                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
                    color: userColor
                };
                history.push(obj);
                history = history.slice(-100);

                var json = JSON.stringify({
                    type: "message",
                    data: obj
                });

                for (let i = 0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });

    connection.on("close", function(connection){
        console.log("on close triggered");
        if(userName !== false && userColor !== false) {
            console.log((new Date())+" Peer "+connection.remoteAddress+" disconnected.");
            clients.splice(index, 1);
            colors.push(userColor);
        }
    });
});


function serveFile(response, filePath, contentType) {
    fileSystem.readFile(filePath, function (err, fileContent) {
        response.writeHead(200, {
            'Content-Type': contentType
        });
        response.write(String(fileContent));
        response.end();
    });
}