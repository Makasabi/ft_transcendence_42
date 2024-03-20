function route(path) {
	window.history.pushState({}, "", path);
	handleLocation();
};

function is_log() {
	return false;
}

async function getMyProfile() {
	let html = fetch("/static/me.html").then(response => response.text());
	let user = fetch("/api/user_management/me").then(response => response.json());

	let [main, user_data] = await Promise.all([html, user]);

	main = main.replace("{{username}}", user_data.username);
	main = main.replace("{{email}}", user_data.email);

	document.querySelector("main").innerHTML = main;
}

async function handleLocation() {
	if (!is_log()) {
		document.querySelector("header").innerHTML = await fetch("/static/header.html").then(response => response.text());
		document.querySelector("footer").innerHTML = await fetch("/static/footer.html").then(response => response.text());
		if (window.location.pathname === "/signup")
		{
			document.querySelector("main").innerHTML = await fetch("/static/signup.html").then(response => response.text());
		}
		else if (window.location.pathname === "/login")
		{
			document.querySelector("main").innerHTML = await fetch("/static/login.html").then(response => response.text());
		}
		else if (window.location.pathname === "/me")
		{
			getMyProfile();
		}
		else {
			document.querySelector("main").innerHTML = await fetch("/static/home.html").then(response => response.text());
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

window.route = route;
