import { footer, LoggedHeaderView, HomeView } from "./home/home.js";
import { MeView } from "./user_mgt/MeView.js";
import { FriendsView } from "./user_mgt/FriendsView.js";
import { UserView } from "./user_mgt/UserView.js";
import * as login from "./login/login.js";
import { GameView } from "./game/GameView.js";
import { UnloggedHeaderView, LoginView, SignupView, Forty2View } from "./login/login.js";
import { FullRoomView, UnknownRoomView, createRoomView, } from "./room/room.js";
import { RoomView } from "./room/RoomView.js";


/*** Views ***/
var view = null;

const loggedViews = [
	HomeView,
	MeView,
	FriendsView,
	UserView,
	// GameView,
	createRoomView,
	RoomView,
	UnknownRoomView,
	FullRoomView,
];

const unloggedViews = [
	LoginView,
	SignupView,
	Forty2View,
	login.GoogleView,
	login.UsernameView,
];
	
	/*** Utilities ***/
export async function route(path, event=null)
{
	if (event)
		event.preventDefault();
	window.history.pushState({}, "", path);
	await handleLocation();
}

async function handleLocationViews(views, defaultRoute)
{
	const match = views.filter(view => view.match_route(window.location.pathname));
	if (match.length === 0) {
		console.warn("No route matches the path:", window.location.pathname);
		route(defaultRoute);
		return;
	}
	if (match.length > 1)
	{
		console.warn("Multiple routes match the same path:", window.location.pathname);
		return;
	}
	console.log("this is the current view:", view);
	if (view)
		view.destroy();
	view = new match[0]();
	await view.render();
}

async function handleLocation()
{
	var was_logged;

	await login.is_logged().then(async (is_logged) => {
		console.log("is_logged", is_logged);
		if (was_logged !== is_logged)
			await update_header(is_logged);
		if (is_logged)
		{
			await handleLocationViews(loggedViews, "/home");
			was_logged = true;
		}
		else
		{
			await handleLocationViews(unloggedViews, "/login");
			was_logged = false;
		}
	});
}

async function update_header(is_logged)
{
	var headerView = null;
	
	if (headerView)
		headerView.destroy();
	headerView = new (is_logged ? LoggedHeaderView : UnloggedHeaderView)();
	await headerView.render();
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
		case "not-registered":
			e.preventDefault();
			route(e.target.href);
			break;
	}
});

document.route = route;
document.logout = login.logout;
