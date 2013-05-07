self.addEventListener('message',function( e ){

// this is an array of arrays listing the possible winning lines.
	var lines = [
			["00","11","22"], ["02","11","20"],	// the diagonals
			["00","01","02"], ["10","11","12"], ["20","21","22"], // the verticals
			["00","10","20"], ["01","11","21"], ["02","12","22"] // the horozontals
		];

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
					retval.players = 2; // assign two lobbyed players
					retval.serverData = { 
						board : {},
						turn: 0, win:-1 };
					for ( var x=0;x<=2;x++)
						for ( var y=0;y<=2;y++){
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
			for ( var lineId in lines ){
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
			}
			for ( var i in retval.clientData ){
				var client = retval.clientData[i];
				client = { board:retval.serverData.board , msg:"" };
				if ( retval.serverData.win == -1 ){
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
				self.postMessage({console:"client "+i+"  "+JSON.stringify(client)});
			}
		}
		retval.serverData.autoOnChange = true; // update when something changes
		self.postMessage({console:"RETVAL "+JSON.stringify(retval)});
		self.postMessage( retval );
	});
