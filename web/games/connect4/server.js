self.addEventListener('message',function( e ){

		function tryline( board , sx , sy , dx , dy ){
			var n = board[ sx+"_"+sy ];
			var i;
			if ( n < 0 ) return false;
		self.postMessage({console:"checking "+sx+","+sy+"  "+dx+","+dy+"  "+n });
			var ix = sx + dx;
			var iy = sy + dy;
			for ( i=0 ; i<(board.linelength-1);i++ ){
		self.postMessage({console:"    "+ix+","+iy+"  "+i+"  "+board[ ix+"_"+iy ] });
				if ( n != board[ ix+"_"+iy ] ){
					return false;
				}
				ix += dx;
				iy += dy;
			}
		self.postMessage({console:"  WIN" });
			ix = sx;
			iy = sy;
			for ( i=0 ; i<board.linelength;i++ ){
				board[ ix+"_"+iy ] = n+2;
				ix += dx;
				iy += dy;
			}

			return true;
		}


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
					var board = { width:8, height:6 , linelength:4 };
					retval.serverData = { 
						board : board,
						turn: 0, win:-1 };
					for ( var x=0;x<=board.width;x++)
						for ( var y=0;y<=board.height;y++){
							if ( y == board.height ){
								retval.serverData.board[x+"_"+y] = -2; // -2 is avalaible...
							}else{
								retval.serverData.board[x+"_"+y] = -1;
							}
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
					if ( retval.serverData.board[ playerData.move ] == -2 ){
						retval.serverData.board[ playerData.move ] = activePlayer;
						retval.serverData.turn = 1-activePlayer;
						// update the valid positions
						var parts = playerData.move.split("_");
						if ( parts[1] > 0 ){
							// it's not the top row
							var nextValid = parts[0]+"_"+(parts[1]-1);
							retval.serverData.board[ nextValid ] = -2;
						}
					}
				}
			}
			// check for wins
			// basic idea, start at the bottom and trace possible lines
			//  not very efficient, but should work
			var board = retval.serverData.board;
			for ( var y=board.height;y>0;y--){
				for ( var x=0;x<=board.width;x++){
					if ( tryline(board,x,y,0,-1) ){
						// win straight up
						y = -1;
						x = 1000;
					}else if ( x > 3 ){
						if ( tryline(board,x,y,-1,-1) || tryline(board,x,y,-1,0) ){
							y = -1;
							x = 1000;
						}
					}else if ( x < board.width-4 ){
						if ( tryline(board,x,y,1,-1) || tryline(board,x,y,1,0) ){
							y = -1;
							x = 1000;
						}
					}
				}
			}
			if ( x == 1000 ){
				retval.serverData.win = 1; // should work out the correct player :)
			}
			retval.serverData.board = board;
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
					if ( retval.serverData.board[n] == -2 ){
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
