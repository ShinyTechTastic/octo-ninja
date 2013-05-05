$(function () {
    "use strict";

    var dialog = (function( div ){
		var titleE = div.find("h2");
		var messageE = div.find("p");
		return {
			show:function( title , message ){
				titleE.text( title );
				messageE.text( message );
				div.fadeIn("fast");
			},
			hide:function(){
				div.fadeOut("fast");
			}
		};
	}( $("#dialog") ));

    dialog.show("Connecting","Please wait");

    var display;

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    var connection = new WebSocket('ws://localhost:1337');

    connection.onerror = function (error) {
	dialog.show("Sorry, but there's some problem with your connection or the server is down.");
    };

    connection.sendJSON = function (obj) {
	connection.send( JSON.stringify(obj) );
    };

    connection.onopen = function () {
	dialog.show("Connected","Awaiting a free game :)");
	connection.sendJSON( { connectionType:"client" , gameType:"alpha" } );
    };


    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: '+ message.data);
	    console.log( "Error" , e );
	    dialog.show("Error","The servers gone nuts:"+message.data + "  " + e );
            return;
        }
	    var gameName = json.gameName;
	    if ( json.type === "server" ){
		var worker = new Worker("server/"+gameName+".js");
                worker.addEventListener("message",function(data){
			connection.sendJSON( {
				type:"serverUpdate",
				data:data
			} );
		});
		worker.postMessage( json );
	    }else if ( json.type === "client" ){
		if ( !display ){
			display = buildDisplay( $("#content") );
		}
		clientUpdate( json , 
			function( data ){
				connection.sendJSON( {
					type:"clientUpdate",
					data:data
				} );
			} , dialog , display );
	    }else{
			dialog.show("Error","Unknown JSON message type:"+message.data)
	    }
    };

});
