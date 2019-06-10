$(function() {
    "use strict";

    var content = $("#content");
    var input = $("#input");
    var status = $("#status");

    var myColor = false;
    var myName = false;

    var webSocketPort = 2573;
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    if(!window.WebSocket){
        content.html($("<p>", {text:"Sorry, but your browser doesn't support WebSocket."}));
        input.hide();
        $("span").hide();
        return;
    }

    var connection = new WebSocket("ws://127.0.0.1:"+webSocketPort);

    connection.onopen = function() {
        input.removeAttr("disabled");
        status.text("Choose name: ");
    };

    connection.onerror = function(error) {
        content.html($("<p>"+ {
            text: "Sorry, but there's some problem with your connection or server is down"
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

        if (json.type === "color") {
            myColor = json.data;
            status.text(myName + ":").css("color", myColor);
            input.removeAttr("disabed").focus();
        } else if (json.type === "history") {
            for (let i = 0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text, json.data[i].color, new Date(json.data[i].time));
            }
        } else if (json.type === "message") {
            input.removeAttr("disabed");
            addMessage(json.data.author, json.data.text, json.data.color, new Date(json.data.time));
        } else {
            console.log("Hmm... I've never seen JSON like this:", json);
        }
    };

    input.keydown(function(e){
        if(e.keyCode === 13) {
            //console.log("Enter Key triggered");
            var msg = $(this).val();
            //console.log("msg : "+msg);
            if(!msg){
                return;
            }
            connection.send(msg);
            $(this).val("");
            input.attr("disabed", "disabed");
            if (myName === false) {
                myName = msg;
            }
        }
    });

    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text("Error");
            input.attr("disabed","disabed");
            input.val("Unable to communicate with WebSocket Server.");
            console.error("Unable to communicate with WebSocket Server.")
        }
    }, 3000);

    function addMessage(author, message, color, dt) {
        content.append(
            "<p>" +
                /* getTimeStamp() + */
                "<span style=\"color: " + color + "\">&nbsp;&nbsp;&nbsp;@" + author + "</span>" +
                ": " + message + 
            "</p>");
    }

});


function getTimeStamp() {
    let dt = new Date();

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

    //return `${dd}/${MM}/${yyyy} ${hh}:${mm}:${ss}.${SSS}`;
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