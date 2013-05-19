self.addEventListener('message',function( e ){

		var obj = e.data;
		var retval = {};
		self.postMessage({console:"Running "+JSON.stringify(obj)});
		if ( obj.request ){ // we have a request
			if ( obj.request.state === "create" ){
				var players = obj.request.players;
				if ( players < 2 ){
					retval.state = "not possible";
					self.postMessage( retval );
					return;
				}else{
					retval.players = 2; // assign two lobbied players
					retval.serverData = { 
						board : { width:8, height:6 },
						turn: 0, win:-1 };
					for ( var x=0;x<=board.width;x++)
						for ( var y=0;y<=board.height;y++){
							retval.serverData.board[x+""+y] = -1;
						}
					retval.clientData = [];
					for ( var i=0; i< obj.request.players ; i++ ){
						retval.clientData[i] = {};
					}
				}
			}else{
				retval.serverData = obj.request.serverData;
				retval.clientData = [];
				for ( var i=0; i< obj.request.clientData.length ; i++ ){
					retval.clientData[i] = {};
				}
			}
			var activePlayer = retval.serverData.turn;
			if ( obj.request.clientData ){
				var playerData = obj.request.clientData[activePlayer];
				if ( playerData.move ){
					// make a move...
					if ( retval.serverData.board[ playerData.move ] == -1 ){
						retval.serverData.board[ playerData.move ] = activePlayer;
						retval.serverData.turn = 1-activePlayer;
					}
				}
			}
			// check for wins
/*			for ( var lineId in lines ){
				var line = lines[lineId];
				var sym = retval.serverData.board[line[0]];
				if ( sym == -1 ) continue;
				var s2 = retval.serverData.board[line[1]];
				if ( s2 != sym ) continue;
				var s2 = retval.serverData.board[line[2]];
				if ( s2 != sym ) continue;
				// this line wins...
				retval.serverData.turn = -1;
				retval.serverData.win = sym;
				for ( p in line ){
					retval.serverData.board[line[p]] = 2+sym;
				}
			}*/
			// check for draws
			if ( retval.serverData.win == -1 ){
				retval.serverData.win = 2;
				for ( n in retval.serverData.board ){
					if ( retval.serverData.board[n] == -1 ){
						retval.serverData.win = -1;
					}
				}
			}
			// check for players exiting
			if ( retval.serverData.win == -1 ){
				for ( var i in obj.request.clientStatus ){
					if ( ! obj.request.clientStatus[i].alive ){
						retval.serverData.win = 3;
					}
				}
			}
			for ( var i in retval.clientData ){
				var client = retval.clientData[i];
				client = { board:retval.serverData.board , msg:"" };
				if ( retval.serverData.win == 3  ){
					client.msg = "Match Canceled";
					client.active = false;
				}else if ( retval.serverData.win == 2  ){
					client.msg = "Draw!";
					client.active = false;
				}else if ( retval.serverData.win == -1 ){
					if ( i == retval.serverData.turn ){
						client.msg = "Your turn!";
						client.active = true;
					}else{
						client.msg = "Your opponenets turn!";
						client.active = false;
					}
				}else{
					if ( i == retval.serverData.win ){
						client.msg = "You won!";
					}else{
						client.msg = "You lost!";
					}
					client.active = false;
				}
				retval.clientData[i] = client;
			}
		}
		if ( retval.serverData.win != -1  ){
			retval.serverData.autoOnChange = false; // don't update when something changes these are end states
			retval.serverData.gameOver = true;
		}else{
			retval.serverData.autoOnChange = true; // update when something changes
		}
		self.postMessage({console:"RETVAL "+JSON.stringify(retval)});
		self.postMessage( retval );
	});
