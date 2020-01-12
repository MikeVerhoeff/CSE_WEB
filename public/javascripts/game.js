// ***********************
// *     connection      *
// ***********************

// connect to server via web socket
let socket = new WebSocket("ws://localhost/ws"); // change back to localhost
var command = {};
var colors = ["Red", "Blue", "Green", "Yellow"];
var playerid=0;

socket.onopen = function(e) {
  console.log("[open] Connection established");
  socket.send('{"command":"gamelist"}');
};

socket.onmessage = function(event) { // check the request and call the coresponding function
  console.log(event.data);
  try {
	var data = JSON.parse(event.data);
	if(command[data.command]) {
		command[data.command](data);
	}
  } catch(e) {
	  console.log("a parsing error occured: "+event);
  }
};

socket.onclose = function(event) {
  if (event.wasClean) {
    alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    // e.g. server process killed or network down
    // event.code is usually 1006 in this case
    alert('[close] Connection died');
  }
};

socket.onerror = function(error) {
  alert(`[error] ${error.message}`);
};

// *********************************************************
// *   resond to player input and send request to server   *
// *********************************************************

function joinGame(id=0) {
	socket.send('{"command":"join","id":'+id+'}');
	document.getElementById('overlay').style.display = 'none';
}

function createGame() {
	socket.send('{"command":"create"}'); // TODO: add extra info?
}

function requestMove(id) {
	socket.send('{"command":"move","id":"'+id+'"}');
}

function roleDice() {
	socket.send('{"command":"roledice"}');
}



// ***********************************************
// *   handle command recieved from the server   *
// ***********************************************

command.gamelist = function(data) {		// show currently active games
	var gamelist = document.getElementById("game_list");
	gamelist.innerHTML="";
	for(var key in data.games) {
		var game = data.games[key];
		console.log(game);
		var e = document.createElement("DIV");
		e.innerHTML="id:"+game.id+", players:"+game.players+"/4 <button onclick='joinGame("+game.id+");'>JOIN</button>";
		gamelist.appendChild(e);
	}
};

command.created = function(data) {
	//console.log("join created");
	joinGame(data.id);
};

command.movepawn = function(data) {
	var x=data.to%11;
	var y=Math.floor(data.to/11);
	document.getElementById("game_board").rows[y].cells[x].appendChild(document.getElementById(data.id));
	//data.from, data.to, data.pawnid
	// get pawn using id
	// get new location row=data.to%11 coloum=math.floor(data.to/11)
	// set pawn as child of the location
};

command.joinoke = function(data)  {
  if(data.status!="oke") {
    alert("could not join game:"+data.status);
  }
};

command.start = function(data) {
	document.getElementById("status").innerText = "Game Started, You are player "+(data.playerid+1)+" "+colors[data.playerid];
	playerid = data.playerid;						// save which player the player is
	var pawns = document.getElementsByClassName("pawn");
	for(let i=0; i<pawns.length; i++) {				// make some the players pawns clickable
		if(pawns[i].id.charAt(1)==(playerid+1)) {
			console.log("Your pawn: "+pawns[i].id);
			pawns[i].onclick = function() {
				console.log("clicked pawn");
				requestMove(this.id);
			}
		}
	}
};

command.playercount = function(data) {
	document.getElementById("status").innerText = "Waiting for players: "+data.count+"/4";
};

command.yourturn = function(data) {
	document.getElementById("status").innerHTML = "It is your turn player: "+(playerid+1)+" "+colors[playerid]+"<button onclick='roleDice();'>role doce</button>";
};

command.endturn = function(data) {
	document.getElementById("status").innerText = "Waiting for other players moves";
}

command.dicerole = function(data) {
	document.getElementById("status").innerText = "You roled: "+data.num;
}

command.disconnect = function(data) {
	document.getElementById("status").innerText = "Lost connection: "+data.why;
}
