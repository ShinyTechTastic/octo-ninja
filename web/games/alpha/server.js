self.addEventListener('message',function( e ){
		var obj = e.data;
		var retval = {};
		self.postMessage({console:"Running "+JSON.stringify(e.data)});
		if ( obj.request ){
			if ( obj.request.state === "create" ){
				var players = obj.request.players;
				if ( players < 2 ){
					retval.state = "not possible";
					self.postMessage( retval );
					return;
				}else{
					retval.players = players; // assign all the lobbyed players
					retval.serverData = { 
						messages : [],
							};
					retval.clientData = [];
					for ( var i=0; i< obj.request.players ; i++ ){
						retval.clientData[i] = { messages:[] , myMessages:[] };
					}
				}
			}else if ( e.data.request.state === "update" ){
				retval = obj.request;
				// push messages from users
				for ( var i in obj.request.clientData ){
					var client = obj.request.clientData[i];
					for ( var k in client.myMessages ){
						retval.serverData.messages.push( 
							{text:client.myMessages[k].text||"", user:i} );
					}
					client.myMessages = [];
				}
				for ( var i in obj.request.clientData ){
					var client = obj.request.clientData[i];
					client.messages = retval.serverData.messages;
				}
			}
		}
		self.postMessage({console:"RETVAL "+JSON.stringify(retval)});
		retval.serverData.autoTime = 2000; // update automaticaly every half a second
		self.postMessage( retval );
	});
