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
		var m = { text : enter.val() };
		if ( name.val() ){
			m.name = name.val();
			name.val("");
		}
		div.send( { myMessages:[m] } );
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

function clientUpdate( obj , reply , dialog , display ){
	console.log("Doing client update.");
	dialog.hide();
	display.send = reply;
	if ( obj ){
		if ( typeof obj.clientData.messages !== "undefined" ){
			var i;
			display.find("p").remove();
			for ( i in obj.clientData.messages ){
				var msg = obj.clientData.messages[i];
				var from = $("<span>").addClass("name").text( msg.from );
				var msgtext = $("<span>").addClass("message").text( msg.text );
				display.append( $("<p>").addClass("id"+msg.user).append(from).append(msgtext) );
			}
		}
	}
}

