
// ********************************************
// *                classes                   *
// ********************************************

class Tile {
	//var pos;
	//var next;
	constructor(x, y, next) {
		this.pos = y*11+x;
		this.next = next;
	}
}

class GameBord {
	//var starts; //array
	//var startStore; //2d array
	//var endStore; //2d array
	
	constructor() {
		var s2 = new Tile(10,6,null); // setup which tile comes after which other one
		var s3 = new Tile(4,10,null); // (like a circularly linkedlist)
		var s4 = new Tile(0,4,null);
		var s1 = new Tile(6,0,
				 new Tile(6,1,
				 new Tile(6,2,
				 new Tile(6,3,
				 new Tile(6,4,
				 new Tile(7,4,
				 new Tile(8,4,
				 new Tile(9,4,
				 new Tile(10,4,
				 new Tile(10,5, s2))))))))));
		s2.next= new Tile(9,6,
				 new Tile(8,6,
				 new Tile(7,6,
				 new Tile(6,6,
				 new Tile(6,7,
				 new Tile(6,8,
				 new Tile(6,9,
				 new Tile(6,10,
				 new Tile(5,10, s3)))))))));
		s3.next= new Tile(4,9,
				 new Tile(4,8,
				 new Tile(4,7,
				 new Tile(4,6,
				 new Tile(3,6,
				 new Tile(2,6,
				 new Tile(1,6,
				 new Tile(0,6,
				 new Tile(0,5, s4)))))))));
		s4.next= new Tile(1,4,
				 new Tile(2,4,
				 new Tile(3,4,
				 new Tile(4,4,
				 new Tile(4,3,
				 new Tile(4,2,
				 new Tile(4,1,
				 new Tile(4,0,
				 new Tile(5,0, s1)))))))));
		this.starts = [s1,s2,s3,s4]
		this.store = [
			[new Tile(), new Tile(), new Tile(), new Tile()],// fill in positions
			[new Tile(), new Tile(), new Tile(), new Tile()],
			[new Tile(), new Tile(), new Tile(), new Tile()],// not in use, let client hanle storing pawns?
			[new Tile(), new Tile(), new Tile(), new Tile()]
		];
		this.end = [
			[new Tile(5, 1, 0), new Tile(5, 2, 1), new Tile(5, 3, 2), new Tile(5, 4, 3)],
			[new Tile(9, 5, 0), new Tile(8, 5, 1), new Tile(7, 5, 2), new Tile(6, 5, 3)],
			[new Tile(5, 9, 0), new Tile(5, 8, 1), new Tile(5, 7, 2), new Tile(5, 6, 3)],
			[new Tile(1, 5, 0), new Tile(2, 5, 1), new Tile(3, 5, 2), new Tile(4, 5, 3)]
		];
	}
}
// this does not necesarely have to be a class it could be in the prototype of gamestate
const gameboard = new GameBord();

class GameState { // this is what is actualy saved per game that is active
	// store all the pawns
	// store the players
	constructor() {
		this.playerpawns=[
			[new Pawn("p1_1", 1), new Pawn("p1_2", 2), new Pawn("p1_3", 3), new Pawn("p1_4", 4)],
			[new Pawn("p2_1", 1), new Pawn("p2_2", 2), new Pawn("p2_3", 3), new Pawn("p2_4", 4)],
			[new Pawn("p3_1", 1), new Pawn("p3_2", 2), new Pawn("p3_3", 3), new Pawn("p3_4", 4)],
			[new Pawn("p4_1", 1), new Pawn("p4_2", 2), new Pawn("p4_3", 3), new Pawn("p4_4", 4)]
		];
		this.players = [];
		this.currentplayer=0;
		this.lastrole=false;
	}
	
	sendAll(command) { // send a command to all the players in the current game
		for(let i=0; i<this.players.length; i++) {
			if(this.players[i].readyState === this.players[i].OPEN) {
				this.players[i].send(command);
			}
		}
	}
	
	getPawnFromID(id) {
		return this.playerpawns[parseInt(id.charAt(1))-1][parseInt(id.charAt(3))-1];
	}
	
	getPlayerFromPawnId(id) {
		return parseInt(id.charAt(1)-1);
	}
	
	start() { // tell players which player thay are and that the game started. Also tell that is is player 0's turn
		for(let i=0; i<this.players.length; i++) {
			this.players[i].send('{"command":"start", "playerid":'+(i)+'}');
		}
		this.players[this.currentplayer].send('{"command":"yourturn"}');
	}
	
	updateStatus() { // send the updated number of players
		for(let i=0; i<this.players.length; i++) {
			this.players[i].send('{"command":"playercount", "count":'+this.players.length+'}');
		}
	}
	
	nextTurn() { // inform that the privous turn has ended and that it is now the next players turn
		this.players[this.currentplayer].send('{"command":"endturn"}');
		this.lastrole=false;
		this.currentplayer = (this.currentplayer+1)%4
		this.players[this.currentplayer].send('{"command":"yourturn"}');
	}
	
}

class Pawn {
	//var id;
	//var onTile;
	constructor(id, tile) {
		this.id=id;
		this.onTile=tile;
	}
	isInGame() {
		return typeof(this.onTile)=="object" || this.onTile>4; // pawns that are still in 'storage' or on the end have a number as tile to denote that fact 
	}
	moveTo(ws, tile, gamestate) {
		// move to number could be added for better code elseware
		
		//console.log("move function start");
		var command = '{"command":"movepawn", "id":"'+this.id+'", "to":"'+tile.pos+'","from":"'+this.onTile.pos+'"}'
		//console.log(command);
		//console.log(gamestate.players.length);
		for(let i=0; i<gamestate.players.length; i++) {
		  gamestate.players[i].send(command);
		}
		this.onTile=tile;
		//console.log("move function end");
	}
}






