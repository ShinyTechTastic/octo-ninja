function buildDisplay( div ){
	var board = div.find(".board");
	board.on("click","td.valid",function( e ){
		console.log("Click active!");
		if ( div.active ){
			div.active = false;
			div.send( {move:e.target.id} );
		}
	});

	div.cellW = 0;
	div.cellH = 0;

	div.send = function(){};
	return div;
}

var chars = { "-2":"." , "-1":" " , "0":"A" , "1":"B" , "2":"A" , "3":"B"};
var styles = { "-2":"valid" , "-1":"empty" , "0":"cellA" , "1":"cellB" , "2":"winA" , "3":"winB" };

function clientUpdate( obj , reply , dialog , display ){
	console.log("Doing client update.");
	console.log( obj );
	dialog.hide();
	var board = obj.clientData.board;
	if ( board ){
		// update the board
		if ( display.cellW != board.width || display.cellH != board.height ){
			console.log("Rebuilding board")
			// rebuild the board array
			var table = display.find(".board");
			table.find("td").remove();
			for ( var y=0;y<=board.height;y++){
				var tr = $("<tr>");
				for ( var x=0;x<=board.width;x++){
					var id = x+"_"+y;
					tr.append( $("<td>").attr( "id" , id ) );
				}
				table.append( tr );
			}
			display.cellW  = board.width;
			display.cellH = board.height;
		}
		for ( var x=0;x<=board.width;x++){
			for ( var y=0;y<=board.height;y++){
				var id = x+"_"+y;
				var c = display.find("#"+id);					
				var b = board[id];
				c.text( chars[b] );
				for ( i=-2;i<4;i++){
					c.toggleClass( styles[i] , i==b );
				}
			}
		}
		display.active = obj.clientData.active;
		display.find(".status").text(obj.clientData.msg);
	}
	display.send = reply;
}

