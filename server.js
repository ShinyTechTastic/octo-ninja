var WebSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');

var lobby = {};
var playedGames = {};
var idleServers = [];

var activeGames = [];

function loadFile( fn , mime ){
  var filedata = "";
  if ( !mime ){
    if ( /.html/i.exec( fn ) ){
      mime = "text/html";
    }else if ( /.js/i.exec( fn ) ){
      mime = "application/javascript";
    }
  }
  function read(){
    fs.readFile(fn, 'utf8', 
        function (err,data) {
  	  if (err) {
  	    return console.log(err);
	  }
	  filedata = data;
	});
  }
  fs.watch( fn , {persistent:false} ,read );
  read();
  return function( response ){
        response.writeHead(200, {'Content-Type': mime});
        response.end(filedata);
   };
}

var index = loadFile( "web/index.html" ,"text/html" ); // this is the default file

var paths = {};

function buildPathFile( path , base , file ){
	fs.stat( path+"/"+file , function(err,stat){
		if ( err ){
			console.log("ERROR "+err);
		}else if ( stat && stat.isDirectory() ){
			buildPaths( path+"/"+file , base+file+"/" );
		}else if ( stat && stat.isFile() ){
			console.log("found file "+base+file);
			paths[ base+file ] = loadFile( path+"/"+file );
		}
	} );
}

function buildPaths( path , base ){
	if ( !base ){
		base = "";
	}
	fs.readdir( path , function( err , files ){
		var i;
		for( i in files ){
			buildPathFile( path , base , files[i] );
		}
	} );
}
buildPaths( "web" );

var server = http.createServer(function(request, response) {
//   console.log((new Date()) + ' HTTP server. URL' + request.url + ' requested.');
    for ( path in paths ){
      if ( "/"+path === request.url ){
        paths[path]( response );
        return;
      }
    } 
    if (request.url === '/') {
	index( response );
        return;
    }else if (request.url === '/status') {
        response.writeHead(200, {'Content-Type': 'application/json'});
        var responseObject = {
		games:{}, idleservers:idleServers.length,		
        }
	for ( var n in lobby ){
		if ( !responseObject.games[n] ){
			responseObject.games[n] = {};
		}
		responseObject.games[n].lobby = lobby[n].length;
	}
	for ( var n in playedGames ){
		if ( !responseObject.games[n] ){
			responseObject.games[n] = {};
		}
		responseObject.games[n].played = playedGames[n];
	}
	for ( var n in activeGames ){
		var t = activeGames[n].gameType;
		if ( !responseObject.games[t] ){
			responseObject.games[t] = {};
		}
		responseObject.games[t].active = (responseObject.games[t].active||0)+1;
	}

        response.end(JSON.stringify(responseObject));
    } else {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('Sorry, unknown url');
    }
});

server.listen(1337, function() {
    console.log((new Date()) + "HTTP Server is listening on port " + 1337);
});

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

function createUnknownConnection( c , origin ){
  var connection = {
    origin: origin,
    receive : function(message){
       console.log( "received: "+JSON.stringify( message )+" from "+origin );
       if ( message.connectionType ){
	 if ( message.connectionType === "server" ){
	   console.log(origin+" is a server...");
           makeServerConnection( this );
         }else{
	   console.log(origin+" is a client...");
           makeClientConnection( this , message.gameType );
         }
       }else{
         console.log("Unknown message to unknown connection");
       }
    },
    send : function(message){
	c.sendUTF(JSON.stringify( message ));
    },
    forceClose : function(){
	c.close();
    },
    close : function(){
       console.log("Unknown connection lost! weird huh?");
    }
  };
  c.on('message', function(message){ connection.receive(JSON.parse(message.utf8Data)); } );
  c.on('close', function(){ console.log("Connection closed."); connection.close(); } );
  return connection;
}

function makeServerConnection( c ){
  c.receiveIdle = function( message ){
    console.log("Message from idle server?");
  }
  c.closeIdle = function(){
    var index = idleServers.indexOf( c );
    idleServers = idleServers.splice( index , 1 );
  }
  c.receive = c.receiveIdle;
  c.close = c.closeIdle;
  idleServers.push( c );
  idleServersUpdate();
}

function idleServersUpdate(){
  if ( serverQueue.length > 0 ){
    var n = serverQueue.pop();
    var server = idleServers.pop();
    doOnServerA( n.request , n.callback , server );
  }
}

function makeClientConnection( c , gameType ){
  c.gameType = gameType;
  c.assignGame = function( game , id ){
    c.game = game;
    c.id = id;
    game.clientStatus[id].alive = true;
  }
  c.receive = function( message ){
   if ( c.game ){
     c.game.clientData[c.id] = message.data;
     console.log( c.game.clientData[c.id] );
     if ( c.game.serverData.autoOnChange ){
       updateGame( c.game );
     }
   }else{
     console.log("Updated state for non-existant game.");
   }
  }
  c.alive = true;
  c.close = function(){
    // Remove from lobby
    var index = lobby[ gameType ].indexOf( c );
    if ( index > -1 ){
      lobby[ gameType ] = lobby[ gameType ].splice( index , 1 );
    }
    if ( c.game ){
      c.game.clientStatus[c.id].alive = false;
      if ( c.game.serverData.autoOnChange ){ // push an update if we're autoOnChanging
        updateGame( c.game );
      }
    }
  }
  // add to the lobby
  if ( typeof lobby[ gameType ] === 'undefined' ){
    lobby[ gameType ] = [];
  }
  lobby[ gameType ].push(c);
  // create game if possible
  updateLobby( gameType );
}

var serverQueue = [];
function doOnServer( request , callback ){
  if ( idleServers.length == 0 ){
   // queue
   serverQueue.push( { request:request , callback:callback } );
   console.log("Request queued "+serverQueue.length);
  }else{
    doOnServerA( request , callback , idleServers.pop() );
  }
}

function doOnServerA( request , callback , server ){
   server.receive = function(message){
     console.log("Request procesed");
     if ( serverQueue.length > 0 ){
       var n = serverQueue.pop();
       doOnServerA( n.request , n.callback , server );
     }else{
       idleServers.push( server );
       server.receive = server.receiveIdle;
       server.close = server.closeIdle;
     }
     callback( message );
  };
  server.close = function(){
     console.log("Request server lost");
    // request failed so
    doOnServer( request , callback );
  };
  console.log("Request sent to "+server.id);
  server.send( request );
}

function updateLobby( gameType ){
  doOnServer( { gameType:gameType , 
		 request:{
			state:"create",
			players:lobby[gameType].length
			} 
		} , 
    function( reply ){
      if ( reply.state === "not possible" ){
        // This update is not possible - we'll try again with more people once they've joined?
      }else{
        console.log("Game created "+JSON.stringify(reply) );
        var i;
        var game = {
            serverData: reply.serverData||{},
            clientData: reply.clientData||[],
            clientStatus: [],
            all: reply.all|{},
          };
        game.gameType = gameType;
        game.sendUpdates = function(){
          //console.log("SEND UPDATE ");
          //console.log( this );
          for ( var id in this.players){
            //console.log("Sending update to "+id);
            this.players[id].send( { type:"client" , 
                                     all:this.all , 
                                     clientData:this.clientData[id]||{} } );
          }
        };
	game.removeGame = function(){
		var index = activeGames.indexOf( game );
		if ( index > -1 ){
		    activeGames = activeGames.splice( index , 1 );
		}
		for ( var id in this.players){
		    this.players[id].forceClose();
		}
		playedGames[game.gameType] = (playedGames[game.gameType]||0)+1;
	};
        game.postUpdate = function(){
          console.log("POST UPDATE ");
          console.log(this.serverData);
          // finally set a triger if we're auto updating
          if ( this.serverData.autoTime ){
            //console.log("Setting auto-time "+this.serverData.autoTime);
            setTimeout( function(){ 
              //console.log("Doing auto-time");
              updateGame( game );
            } , this.serverData.autoTime );
          }
          if ( this.serverData.gameOver ){
            console.log("Game Over triggered");
            setTimeout( function(){ 
              game.removeGame();
            } , 5000 );
          }
        };
        game.players = [];
        game.playerUpdate = [];
        for( i=0 ; i<reply.players; i++ ){
	  game.clientStatus[i] = {}; // empty status object
          console.log("Adding player "+i);
          var client = lobby[gameType].pop();
	        game.players.push( client );
          game.playerUpdate.push( {} );
          client.assignGame( game , i );
        }
        activeGames.push( game );
        game.sendUpdates();
        game.postUpdate();
      }
    }
  );
}

function updateGame( game ){
  doOnServer( { 
     gameType:game.gameType , 
		 request:{
  			state:"update",
        serverData:game.serverData,
        clientData:game.clientData,
        clientStatus:game.clientStatus,
        all:game.all
  		} 
		} , 
    function( reply ){
      game.all = reply.all||{};
    	game.serverData = reply.serverData;
    	game.state = reply.state;
    	game.clientData = reply.clientData;
    	var id;
      game.sendUpdates();
      game.postUpdate();
    }
  );
}

// WebSocket server
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    console.log("Connection made.");
    createUnknownConnection( connection , request.origin );
});
