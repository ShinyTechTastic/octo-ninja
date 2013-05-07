function buildDisplay( div ){
	div.find(".board").on("click","td",function( e ){
		console.log("Click active!");
		if ( div.active ){
			div.active = false;
			div.send( {move:e.target.id} );
		}
	});
	div.send = function(){};
	return div;
}

var chars = { "-1":"." , "0":"X" , "1":"O" , "2":"X" , "3":"O"};
var styles = { "-1":"empty" , "0":"cellX" , "1":"cellO" , "2":"winX" , "3":"winO" };

function clientUpdate( obj , reply , dialog , display ){
	console.log("Doing client update.");
	console.log( obj );
	dialog.hide();
	var board = obj.clientData.board;
	if ( board ){
		// update the board
		for ( var x=0;x<=2;x++)
			for ( var y=0;y<=2;y++){
				var c = display.find("#"+x+y);					
				var b = board[x+""+y];
				c.text( chars[b] );
				for ( i=-1;i<4;i++){
					c.toggleClass( styles[i] , i==b );
				}
			}
		display.active = obj.clientData.active;
		display.find(".status").text(obj.clientData.msg);
	}
	display.send = reply;
}

