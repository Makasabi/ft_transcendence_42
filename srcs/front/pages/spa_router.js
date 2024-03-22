import { footer, header_in, home } from "/front/pages/home/home.js";
import { header_out, login, signup, login_event, signup_event } from "/front/pages/login/login.js";
import { me } from "/front/pages/user_mgt/user_mgt.js";
import { game } from "/front/pages/game/game.js";

let change_header = true;

/*** Utilities ***/
export function route(path) {
	window.history.pushState({}, "", path);
	handleLocation();
}

function is_log() {
	return document.cookie.includes("token");
}

function logout() {
	document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
	change_header = true;
	route("/login");
}

function update_header() {
	if (change_header)
	{
		(is_log() ? header_in() : header_out()).then(html => {
			document.querySelector("header").innerHTML = html;
		});
		change_header = false;
	}
}

function handleLocation() {
	update_header();

	// Change main content
	const routes = [
		{path : "/login", view : login},
		{path : "/signup", view : signup},
		{path : "/home", view : home},
		{path : "/me", view : me},
		{path : "/game", view : game},
	];

	// Find the route that matches the current location
	const match = routes.filter(route => route.path === window.location.pathname);
	if (match.length > 1)
	{
		console.warn("Multiple routes match the same path");
		return;
	}
	if (match.length > 0)
	{
		match[0].view().then(html => {
			if (html != null)
				document.querySelector("main").innerHTML = html;
		});
		return;
	}
	// If no route matches the current location, redirect to the home page
	if (is_log())
		route("/home");
	else
		route("/login");
}

/*** Events ***/
document.addEventListener("DOMContentLoaded", function () {
	window.onpopstate = function(event) {
		handleLocation();
	};

	footer().then(html => {
		document.querySelector("footer").innerHTML = html;
	});

	handleLocation();
});


document.querySelector("main").addEventListener("click", async (e) => {
	switch (e.target.id) {
		case "submit-login":
			change_header = login_event(e);
			break;
		case "submit-signup":
			signup_event(e);
			break;
		case "not-registered":
			e.preventDefault();
			route(e.target.href);
			break;
	}
});

document.route = route;
document.logout = logout;
