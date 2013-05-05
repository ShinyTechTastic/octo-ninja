if ( typeof games === 'undefined' ){
  games = {};
}


games.alpha = (function(){
	function buildDisplay( div ){
		var name = $("<input>").addClass("name");
		var details = $("<div>").addClass("details");
		var enter = $("<input>").addClass("enter");
		var send = $("<button>").addClass("sendButton").text("send");
		div.append( name );
		div.append( details );
		div.append( enter );
		div.append( send );
		div.send = function( msg ){
			console.log("NOOP SEND!");
		};
		send.click( function(){
			console.log("Sending :"+enter.val());
			var m = { message : enter.val() };
			if ( name.val() ){
				m.name = name.val();
				name.val("");
			}
			div.send( m );
			enter.val("");
		} );
		div.clear = function(){
			details.find("p").remove();
		};
		div.write = function( message ){
			var m = $("<p>").text( message );
			details.append(m);
		};
		return div;
        }
	function serverUpdate( obj , reply ){
		console.log("Doing server update.");
		if ( ! obj.serverData.messages ){
			obj.serverData.messages = [];
		}
		if ( ! obj.serverData.names ){
			obj.serverData.names = [];
		}
		var i;	
		for ( i in obj.clientData ){
			if ( obj.clientData[i] && obj.clientData[i].name ){
				obj.serverData.names[i] = obj.clientData[i].name;
				obj.clientData[i].name = null;
			}			
			if ( obj.clientData[i] && obj.clientData[i].message ){
				var name = obj.serverData.names[i]||"Unknown";
				obj.serverData.messages.push( {fromid:i,from:name,msg:obj.clientData[i].message} );
				obj.clientData[i].message = null;
			}
		}	
		for ( i in obj.clientData ){
			obj.clientData[i].messages = obj.serverData.messages
			obj.clientData[i].ready = false;
		}	
		obj.serverData.autoTime = 500; // update automaticaly every half a second
		reply({
			clientData:obj.clientData,
			serverData:obj.serverData
		});
	}
	function clientUpdate( obj , reply , dialog , display ){
		console.log("Doing client update.");
		dialog.hide();
		display.send = reply;
		if ( obj ){
			if ( typeof obj.messages !== "undefined" ){
				var i;
				display.find("p").remove();
				for ( i in obj.messages ){
					var msg = obj.messages[i];
					var from = $("<span>").addClass("name").text( msg.from );
					var msgtext = $("<span>").addClass("message").text( msg.msg );
					display.append( $("<p>").addClass("id"+msg.fromid).append(from).append(msgtext) );
				}
			}
		}
	}
	return {
		buildDisplay:buildDisplay,
		serverUpdate:serverUpdate,
		clientUpdate:clientUpdate
		};
}());
