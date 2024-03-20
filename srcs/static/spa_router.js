function route(path) {
	window.history.pushState({}, "", path);
	handleLocation();
};

function is_log() {
	return false;
}

async function handleLocation() {
	if (!is_log()) {
		document.querySelector("header").innerHTML = await fetch("/static/header.html").then(response => response.text());
		document.querySelector("footer").innerHTML = await fetch("/static/footer.html").then(response => response.text());
		if (window.location.pathname === "/signup")
		{
			document.querySelector("main").innerHTML = await fetch("/static/signup.html").then(response => response.text());
		}
		else if (window.location.pathname === "/signin")
		{
			document.querySelector("main").innerHTML = await fetch("/static/signin.html").then(response => response.text());
		}
	}
	else {
		//
	}
	// @TODO dynamic body content
};

document.addEventListener("DOMContentLoaded", function () {
	handleLocation();

	window.onpopstate = function(event) {
		handleLocation();
	};
});
