$(function () {
    "use strict";
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    if (window.WebSocket) {
		
	    // open connection
	    var connection = new WebSocket('ws://'+document.location.hostname+':1337');

	    connection.onerror = function (error) {
		dialog.show("Sorry, but there's some problem with your connection or the server is down.");
	    };

	    connection.sendJSON = function (obj) {
		connection.send( JSON.stringify(obj) );
	    };

	    connection.onopen = function () {
		connection.sendJSON( { connectionType:"server" } );
	    };

	    connection.onmessage = function (message) {
		try {
		    var json = JSON.parse(message.data);
		    console.log( "received "+JSON.stringify(json) );
		    var worker = new Worker('games/'+json.gameType+'/server.js');
		    worker.addEventListener('message', function(e) {
			console.log('Worker said: ', e.data);
			if ( e.data.console ){
				console.log( e.data.console );
			}else{
				connection.sendJSON( e.data );
			}
		    }, false);
                    worker.addEventListener('error', function(e){
		      console.log('Worker error: ', e.data);
		    }, false);
		    worker.postMessage(json); // Send data to our worker.
		} catch (e) {
		    console.log('This doesn\'t look like a valid JSON: '+ message.data);
		    console.log( "Error" , e );
		    dialog.show("Error","The servers gone nuts:"+message.data + "  " + e );
		    return;
		}

	    };
	}
});
