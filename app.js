"use strict";

process.title = "websocket-node-chat";

var webSocketServerPort = process.env.PORT || 2573; //get PORT from environment if unavailable, fallback to default port which is 2573

var webSocketServer = require("websocket").server;
var http = require("http");
var fileSystem = require("fs");

var history = [];
var clients = [];
var userList = {};

function htmlEntities(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
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

colors.sort(function(a, b) {
    return Math.random() > 0.5;
});

var server = http.createServer(function(request, response) {

    console.log("request.url : " + request.url);

    if (request.url === "/" || request.url === "/index.html") {
        serveFile(response, "./index.html", "text/html");
    } else if (request.url === "/css/main.css") {
        serveFile(response, "." + request.url, "text/css");
    } else if (request.url === "/js/jquery-3.4.1.min.js") {
        serveFile(response, "." + request.url, "text/javascript");
    } else if (request.url === "/js/wsDemoMain.js") {
        serveFile(response, "." + request.url, "text/javascript");
    } else if (request.url === "/favicon.ico") {
        serveFile(response, "." + request.url, "image/x-icon");
    } else if (request.url === "/status") {
        response.writeHead(200, {
            "Content-Type": "application/json"
        });
        
        let responseObject = {
            currentClients: clients.length,
            totalHistory: history.length
        };

        response.end(JSON.stringify(responseObject));
    } else if (request.url === "/css/bootstrap-4.1.1.min.css") {
        serveFile(response, "." + request.url, "text/css");
    } else if (request.url === "/css/bootstrap-4.1.3.min.css") {
        serveFile(response, "." + request.url, "text/css");
    } else if (request.url === "/css/fontawesome-5.5.0.css") {
        serveFile(response, "." + request.url, "text/css");
    } else if (request.url === "/js/bootstrap-4.1.1.min.js") {
        serveFile(response, "." + request.url, "text/javascript");
    } else if (request.url === "/js/cookies.min.1.2.3.js") {
        serveFile(response, "." + request.url, "text/javascript");
    } else if (request.url === "/webfonts/fa-solid-900.ttf") {
        serveFile(response, "." + request.url, "font/ttf");
    } else if (request.url === "/webfonts/fa-solid-900.woff") {
        serveFile(response, "." + request.url, "binary", true);
    } else if (request.url === "/webfonts/fa-solid-900.woff2") {
        serveFile(response, "." + request.url, "binary", true);
    } else {
        //TODO: Handle error 404 File not found
        response.writeHead(404, {
            "Content-Type": "text/plain"
        });
        response.end("Sorry, unknown URL");
    }

});

server.listen(webSocketServerPort, function() {
    console.log((new Date()) + "\nServer is listening on port " + webSocketServerPort + "\n");
});

var wsServer = new webSocketServer({
    httpServer: server
});

wsServer.on("request", function(request) {
    console.log((new Date()) + "Connection from origin " + request.origin + ".");
    var connection = request.accept(null, request.origin);
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;
    console.log((new Date()) + "Connection accepted");
    //if (history.length > 0) {
        connection.sendUTF(JSON.stringify({
            type: "history",
            data: {
                messages: history,
                users: userList
            }
        }));
    //}

    connection.on("message", function(message) {
        //console.log("on message triggered. message.type : "+message.type);
        if (message.type === "utf8") {
            if (userName === false) {
                userName = htmlEntities(message.utf8Data);
                userList[userName] = true;
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({
                    type: "color",
                    data: userColor
                }));
                for (let i = 0; i < clients.length; i++) {
                    clients[i].sendUTF(JSON.stringify({
                        type: "connect",
                        data: userName
                    }));
                }
                console.log((new Date()) + "User is known as: " + userName + " with " + userColor + " color.");
            } else {
                console.log((new Date()) + "Received message from " + userName + " : " + message.utf8Data);
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

    connection.on("close", function(conn) {
        console.log("on close triggered");
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
            userList[userName] = false;
            clients.splice(index, 1);
            for (let i = 0; i < clients.length; i++) {
                clients[i].sendUTF(JSON.stringify({
                    type: "disconnect",
                    data: userName
                }));
            }
            colors.push(userColor);
        }
    });
});


function serveFile(response, filePath, contentType, isBinaryFile=false) {
    
    fileSystem.readFile(filePath, function(err, fileContent) {

        if(err) {
            response.writeHead(404, {
                "Content-Type": "text/plain"
            });

            response.end("Sorry, The requested file cannot be served");
        } else {
            response.writeHead(200, {
                'Content-Type': contentType
            });

            if(isBinaryFile) {
                response.end(fileContent, "binary");
            } else {
                response.write(String(fileContent));
                response.end();
            }
        }
        
    });
}