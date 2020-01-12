function load() {
	
	// load board game
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		console.log("readyState: "+this.readyState+" status: "+this.status);
		if (this.readyState == 4 && this.status == 200) {
			document.getElementById("game").innerHTML =
			this.responseText
		}
	};
	xhttp.open("GET", "board.html", true);
	xhttp.send();
	
	
	// load board css
	var cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'stylesheets/board.css';
    var head = document.getElementsByTagName('head')[0];
    head.parentNode.insertBefore(cssLink, head);
	
	
	// load game script
	var scriptElement=document.createElement('script');
	scriptElement.type = 'text/javascript';
	scriptElement.src = 'javascripts/game.js';
	document.head.appendChild(scriptElement);
}