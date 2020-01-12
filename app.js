var express = require("express");
var http = require("http");
const fs = require("fs");
const vm = require("vm");
const WebSocket = require('ws');

new vm.Script(fs.readFileSync('./MensErgerJeNietLogic.js')).runInThisContext(); // load game logic

var port = 80;//process.argv[2];
var app = express();
var command = {};
var active_games = {};

app.use(express.static(__dirname + "/public"));

const server = http.createServer(app).listen(port);

const wss = new WebSocket.Server({ server });
wss.on('connection', function(ws) {
  ws.on('message', function (message) {
	console.log("in:  "+message); // check the request and call the coresponding function
	try {
		var data = JSON.parse(message);
		if(command[data.command]) {
			command[data.command](ws, data);
		}
	} catch(e) {
		console.log("\\--> could not be parsed or failed to run");
		console.log(e);
	}

    setTimeout(() => ws.close(1000, "Bye!"), 60000*15);
  });
  ws.on('close', function() {
	if(!ws.game){ws.game={};} // make sure game closes properly 
	if(ws.game.created) { // TODO: also have to stop the game the player was in not just the game that created, but not delete the game multyple times
		
		active_games[ws.game.created].sendAll('{"command":"disconnect","why":"Host left"}');
		delete active_games[ws.game.created];
	}
	// end game of other players
  });
});



// ********************************************
// *        respond to client requests        *
// ********************************************

var active_games = {};
var current_id = 1;

command.gamelist = function(ws, data) { // send which game are currently active
	console.log("out: list");
	var s = "";
	for(var key in active_games) {
	  s=s+'{"id":'+key+',"players":'+active_games[key].players.length+'},';
	}
	ws.send('{"command":"gamelist","games":['+s.slice(0, -1)+']}');
};

command.join = function(ws, data) { // add a player to a game
	console.log("out: join");
	
	if(active_games[data.id].players.length<4) {
	  console.log("game not full");
	  active_games[data.id].players.push(ws);
	  if(!ws.game){ws.game={};}
	  // TODO: disconnect other players from old game if joining new one
	  ws.game.id=data.id;
	  
	  console.log("sending test move");
	  active_games[ws.game.id].playerpawns[0][0].moveTo(ws, gameboard.starts[0], active_games[ws.game.id]); //testing
	  
	  if(active_games[data.id].players.length==4) {  // check if full
		  active_games[data.id].start();
	  } else {
		  active_games[data.id].updateStatus();
	  }
	  
	}  else {
	  console.log("game full!!!");
	  ws.send('{"command":"joinoke","status":"oke"}');
	}
	
	
};

command.create = function(ws, data) { // create a new game that players can join and instruct creating player to join the new game
	console.log("out: create");
	ws.send('{"command":"created","id":'+current_id+'}');
	if(!ws.game){ws.game={};}
	if(ws.game.created) { // if player already has an active game delete that one
		
		active_games[ws.game.created].sendAll('{"command":"disconnect","why":"Host left"}');
		delete active_games[ws.game.created];
	}
	ws.game.created=current_id++;
	active_games[ws.game.created] = new GameState();

	
};

command.move = function(ws, data) {
	// need current game state
	// console.log("out: move, id:"+ws.game.id);
	
	var gs = active_games[ws.game.id];
	if(gs.players[gs.currentplayer]===ws && gs.getPlayerFromPawnId(data.id)===gs.currentplayer){ // check if player is allows to move
		console.log("move oke");
		
		let p = active_games[ws.game.id].getPawnFromID(data.id); //get the pawn to move
		
		// get the numer the player roled
		// TODO: force the player to role a number
		let n=1;
		if(gs.lastrole) {
			n=gs.lastrole;
		}
		
		if(!p.isInGame()) {
			// if pawn is not yet on board
			if(gs.lastrole==6) {
				p.moveTo(ws, gameboard.starts[gs.currentplayer], gs);
			}
			gs.nextTurn();
			return;
		}
		
		let tile = p.onTile;
		
		for(let i=0; i<n; i++) {
			
			if(typeof(tile)=="object") {
				tile = tile.next;
				if(tile===gameboard.starts[gs.currentplayer]) {
					tile = 5;
				}
			} else {
				tile++;
				if(tile==11) {tile=5;}
			}
			// *******************************
			// *
			// *     TODO: enforce the logic of the game: check in plawn land on an other pawn, if it reacted the end, etc.
			// *
			// *****************************
		}
		
		var t=tile;
		if(typeof(tile)!="object") {
			let i = tile-5;
			if(i==4) { i=2; }
			if(i==5) { i=1; }
			tile = gameboard.end[gs.currentplayer][i]
		}
		
		console.log(tile);
		
		p.moveTo(ws,tile,active_games[ws.game.id]);
		if(typeof(t)!="object") {
			p.onTile=t;
		}
		gs.nextTurn(); // tell the next player it is thare turn
		
	} else {
		console.log("wrong move");
	}

};

command.roledice = function(ws, data) {
	var gs = active_games[ws.game.id];
	if(gs.players[gs.currentplayer]===ws){
		if(!gs.lastrole) {
			gs.lastrole=6;//Math.floor(Math.random() * 6) + 1;
			gs.sendAll('{"command":"dicerole", "num":'+gs.lastrole+'}');
		}
	}
}