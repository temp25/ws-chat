$(document).ready(function() {

    var mainContent = $("#content");

    var myColor = false;
    var myName = false;

    let serverMessageHistory = [];
    let serverUserHistory = {};

    var webSocketPort = 2573;
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    if(!window.WebSocket){
        $("#content").html($("<p>", {
            class: "animate-fade",
            html: "<b>Sorry, but your browser doesn't support WebSocket.</b>",
            style: "font-size: 20px; color: red;"
            })
        );
        return;
    }
    
    var connection = new WebSocket("wss://wsnc.herokuapp.com:" + webSocketPort);

    connection.onopen = function() {

        let nick = "";
        if (Cookies.enabled && Cookies.get("ws-chat_username") !== undefined) {
            //sdfsdf
            nick = Cookies.get("ws-chat_username");
        } else {
            
            do {
                nick = window.prompt("Enter your nickname", "");
            } while(nick === "" || nick === null);

            if (Cookies.enabled ) {
                Cookies.set("ws-chat_username", nick, { expires: 2592000}); //expires in 30 days (30 * 24 * 60 * 60 seconds)
            }
        }
        myName = nick;
        connection.send(myName);
        addUser(myName);
    };

    connection.onerror = function(error) {
        content.html($("<p>"+ {
            text: "Sorry, but there's some problem with your connection or server is down",
            style: "font-size: 20px; color: red;"
        }));
    };

    connection.onmessage = function(message) {
        let json;
        try {
            json = JSON.parse(message.data);
        } catch (e) {
            console.log("This doesn't look like a valid JSON: ", message.data);
            return;
        }

        if (json.type === "connect") {
            addUser(json.data);
            $("#messageViewHeader").html("You're identified as <b>"+json.data+"</b>");
            for (let i = 0; i < serverMessageHistory.length; i++) {
                addMessage(getDecodedHtmlText(serverMessageHistory[i].text), getTimeStamp(new Date(serverMessageHistory[i].time)), myName != serverMessageHistory[i].author);
            }
            for (let user in  serverUserHistory) {    
                addUser(user, serverUserHistory[user]);
            }
            serverMessageHistory = [];
            serverUserHistory = {};
        } else if (json.type === "disconnect") {
            updateUserStatus(json.data, false);
        } else if (json.type === "color") {
            myColor = json.data;
        } else if (json.type === "history") {
            for (let i = 0; i < json.data.messages.length; i++) {
                serverMessageHistory.push(json.data.messages[i]);
            }
            serverUserHistory = json.data.users;
        } else if (json.type === "message") {
            addMessage(getDecodedHtmlText(json.data.text), getTimeStamp(new Date(json.data.time)), myName != json.data.author);
        } else {
            console.log("Hmm... I've never seen JSON like this:", json);
        }
    };

    setInterval(function() {
        if (connection.readyState !== 1) {
            console.error("Unable to communicate with WebSocket Server.")
        }
    }, 3000);

    function getDecodedHtmlText(content) {
        return $("<p/>").html(content).text();
    }

    function addUser(userName, isOnline) {

        isOnline = isOnline || true;

        let userElem = $("span:contains('"+userName+"')");

        if(userElem.length > 0) {
            updateUserStatus(userName, isOnline);
        } else {
            $(".contacts").append(
                "<li>" +
                    "<div class=\"d-flex bd-highlight\">" +
                        "<div class=\"user_info\">" +
                            "<span>"+userName+"</span>" +
                            "<p>"+userName+" is online</p>" +
                        "</div>" +
                    "</div>" +
                "</li>"
            );
        }
    }

    function updateUserStatus(userName, isOnline) {
        let status = isOnline ? "Online" : "Offline";
        $("span:contains('"+userName+"')").parent().children("p").text(userName+" is "+status);
    }
    
    function addMessage(message, timestamp, isOthersMessage) {

        let contentJustifierClass = (isOthersMessage) ? "justify-content-start" : "justify-content-end";
        let messageContainerClass = (isOthersMessage) ? "msg_container" : "msg_container_send";
        let msgTimeClass = (isOthersMessage) ? "msg_time" : "msg_time_send";

        $("#messageView").append(
            $("<div class='d-flex " + contentJustifierClass + " mb-4'>" +
                "<div class='" + messageContainerClass+"'>" +
                    message +
                    "<span class='" + msgTimeClass + "'>" + timestamp + "</span>" +
                "</div>" +
            "</div>")
        );

        $("#messageView").animate({
            scrollTop: $("#messageView")[0].scrollHeight
        }, 333);

    }

    $("#sendBtn").on("click", function() {
        if ($("#messageText").val().trim().length !== 0) {
            let msg = "<b>@"+myName+"</b>: <pre>"+$("#messageText").val()+"</pre>";
            console.log("msg");
            console.log(msg);
            connection.send(msg);
        }
        $("#messageText").val("");
    });

    function getTimeStamp(dt) {
        dt = dt || new Date();
    
        let dd = dt.getDate();
        let MM = dt.getMonth()+1;
        let yyyy = dt.getFullYear();
    
        let hh = dt.getHours();
        let mm = dt.getMinutes();
        let ss = dt.getSeconds();
        let SSS = dt.getMilliseconds();
    
        dd = lPadToTwo(dd);
        MM = lPadToTwo(MM);
        hh = lPadToTwo(hh);
        dd = lPadToTwo(dd);
        SSS = lPad(SSS, 3);
        
        return dd+"/"+MM+"/"+yyyy+" "+hh+":"+mm+":"+ss+"."+SSS;
    }
    
    function lPadToTwo(number) {
        return lPad(number, 2);
    }
    
    //pad number with leading padding character (padChar) to match the width
    function lPad(number, width, padChar) {
        padChar = padChar || "0";
        number = number + "";
        return repeat(padChar, width-number.length) + number;
    }
    
    // repeating character char at count time(s) exponentially
    function repeat(char, count) {
        let result = "";
        for(;;) {
            if (count & 1) {
                result += char;
            }
            count >>= 1;
            if (count) {
                char += char;
            } else {
                break;
            }
        }
        return result;
    }

});