import { footer, LoggedHeaderView, HomeView } from "./home/home.js";
import { MeView } from "./user_mgt/MeView.js";
import { UserView } from "./user_mgt/UserView.js";
import * as login from "./login/login.js";
import { GameView } from "/front/pages/game/game.js";
import { UnloggedHeaderView, LoginView, SignupView, Forty2View } from "./login/login.js";
import { FullRoomView, UnknownRoomView, createRoomView, } from "./room/room.js";
import { RoomView } from "./room/RoomView.js";

	/*** Utilities ***/
export function route(path, event=null)
{
	if (event)
		event.preventDefault();
	window.history.pushState({}, "", path);
	handleLocation();
}

function handleUnloggedLocation()
{
	const views = [
		LoginView,
		SignupView,
		Forty2View,
		login.GoogleView,
		login.UsernameView,
	];

	const match = views.filter(view => view.match_route(window.location.pathname));
	if (match.length === 0) {
		console.warn("No route matches the path:", window.location.pathname);
		route("/login");
		return;
	}
	if (match.length > 1)
	{
		console.warn("Multiple routes match the same path:", window.location.pathname);
		return;
	}
	match[0].render();
}

async function handleLoggedLocation()
{
	const views = [
		HomeView,
		MeView,
		// GameView,
		createRoomView,
		RoomView,
		UnknownRoomView,
		FullRoomView,
		UserView,
	];

	const match = views.filter(view => view.match_route(window.location.pathname));
	if (match.length === 0) {
		console.warn("No route matches the path:", window.location.pathname);
		route("/home");
		return;
	}
	if (match.length > 1)
	{
		console.warn("Multiple routes match the same path:", window.location.pathname);
		return;
	}
	match[0].render();
}

function handleLocation()
{
	var was_logged;

	login.is_logged().then(is_logged => {
		console.log("is_logged", is_logged);
		if (was_logged !== is_logged)
			update_header(is_logged);
		if (is_logged)
		{
			handleLoggedLocation();
			was_logged = true;
		}
		else
		{
			handleUnloggedLocation();
			was_logged = false;
		}
	});
}

function update_header(is_logged)
{
	if (is_logged)
		LoggedHeaderView.render();
	else
		UnloggedHeaderView.render();
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
	let tag = this.querySelector("header");
	let parent = tag.parentNode;
	parent.insertBefore(document.getElementsByClassName("particles-js-canvas-el")[0], tag);
});

document.querySelector("main").addEventListener("click", async (e) => {
	switch (e.target.id)
	{
		case "submit-signup":
			login.signup_event(e);
			break;
		case "forty2-auth-btn":
			login.forty2_signup_event(e);
			break;
		case "google-auth-btn":
			e.preventDefault();
			login.google_signup_event(e);
			break;
		case "submit-username":
			login.username_event(e);
			break;
		case "not-registered":
			e.preventDefault();
			route(e.target.href);
			break;
	}
});

document.route = route;
document.logout = login.logout;
