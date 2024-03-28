import { footer, LoggedHeaderView, HomeView } from "./home/home.js";
import { MeView } from "./user_mgt/user_mgt.js";
import * as login from "./login/login.js";

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
	if (!["/login", "/signup", "/username"].includes(window.location.pathname))
	{
		route("/login");
		return ;
	}
	const routes = [
		{path : "/login", view : login.login_render},
		{path : "/signup", view : login.signup_render},
	]
	const match = routes.filter(view => view.path === window.location.pathname);
	if (match.length === 0)
	{
		console.warn("No route matches the path:", window.location.pathname);
		route("/login");
		return;
	}
	if (match.length > 1)
	{
		console.warn("Multiple routes match the same path:", window.location.pathname);
		return;
	}
	match[0].view().then(html => {
		document.querySelector("main").innerHTML = html;
	});

	//const list_params = new URLSearchParams(window.location.search);
	//if (window.location.pathname === "/username" && list_params.get('code'))
	//{
	//	console.log("URL with queries");
	//	await login.forty2_signup();
	//	return ;
	//}
}

function handleLoggedLocation()
{
	const views = [
		HomeView,
		MeView,
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
	var was_logged = false;
	login.is_logged().then(is_logged => {
		console.log("is_logged", is_logged);
		if (was_logged !== is_logged)
			update_header();
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

function update_header()
{
	//const url = ["/login", "/signup"].includes(window.location.pathname);
	//(url ? login.header_log() : header_in()).then(html => {
	//	document.querySelector("header").innerHTML = html;
	//});
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
		case "submit-login":
			login.login_event(e);
			break;
		case "submit-signup":
			login.signup_event(e);
			break;
		case "forty2-auth-btn":
			login.forty2_signup_event(e);
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
