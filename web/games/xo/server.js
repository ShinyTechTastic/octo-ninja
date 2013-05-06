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
					retval.players = 2; // assign two lobbyed players
					retval.serverData = { 
						board : {},
						turn: 0
							};
					for ( var x=0;x<2;x++)
						for ( var y=0;y<2;y++){
							retval.serverData[x+""+y] = 0;
						}
					retval.clientData = [];
					for ( var i=0; i< obj.request.players ; i++ ){
						retval.clientData[i] = { board:retval.serverData.board , msg:"" };
						if ( i === retval.serverData.turn ){
							retval.clientData[i].msg = "Your turn!";
							retval.clientData[i].active = true;
						}else{
							retval.clientData[i].msg = "Your opponenets turn!";
							retval.clientData[i].active = false;
						}
					}
				}
			}else if ( e.data.request.state === "update" ){
				retval = obj.request;
				var activePlayer = retval.serverData.turn;
				var playerData = obj.request.clientData[activePlayer];
				if ( playerData.move ){
					if ( retval.serverData[ playerData.move ] == 0 ){
						retval.serverData[ playerData.move ] = activePlayer;
						retval.serverData.turn = 1-activePlayer;
					}
				}
				for ( var i in retval.clientData ){
					var client = retval.clientData[i];
					client = { board:retval.serverData.board , msg:"" };
					if ( i === retval.serverData.turn ){
						client.msg = "Your turn!";
						client.active = true;
					}else{
						client.msg = "Your opponenets turn!";
						client.active = false;
					}
				}
			}
		}
		self.postMessage({console:"RETVAL "+JSON.stringify(retval)});
		retval.serverData.autoOnChange = true; // update when something changes
		self.postMessage( retval );
	});
