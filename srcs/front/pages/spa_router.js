import { footer, header_in, home } from "/front/pages/home/home.js";
import * as Login from "/front/pages/login/login.js";
import { me } from "/front/pages/user_mgt/user_mgt.js";
import { game } from "/front/pages/game/game.js";

	/*** Utilities ***/
export function route(path)
{
	window.history.pushState({}, "", path);
	handleLocation();
}

async function handleLocation() {
	update_header();

	// Change main content
	const routes = [
		{path : "/login", view : Login.login},
		{path : "/signup", view : Login.signup},
		{path : "/home", view : home},
		{path : "/me", view : me},
		{path : "/game", view : game},
	];

	try
	{
		const log = await Login.is_logged();
		if (!log && !["/login", "/signup"].includes(window.location.pathname))
		{
			route("/login");
			return ;
		}
		const match = routes.filter(route => route.path === window.location.pathname);
		if (match.length > 1)
		{
			console.warn("Multiple routes match the same path");
			return;
		}
		if (match.length > 0)
		{
			match[0].view().then(html => document.querySelector("main").innerHTML = html);
			return;
		}
		route("/home");
	}
	catch (error)
	{
		console.error(error);
	}
}

function update_header()
{
	const url = ["/login", "/signup"].includes(window.location.pathname);
	(url ? Login.header_log() : header_in()).then(html => {
		document.querySelector("header").innerHTML = html;
	});
}

/*** Cookies ***/
export function setCookie(name, value, days)
{
	const expires = new Date();
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
	document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export function getCookie(name)
{
	const cookies = document.cookie.split(';');
	const cookie = cookies.find(cookie => cookie.trim().startsWith(name + '='));
	//console.log("token : ", cookie ? cookie.split('=')[1] : null);
	return cookie ? cookie.split('=')[1] : null;
}

export function deleteCookie(name)
{
	document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
			Login.login_event(e);
			break;
		case "submit-signup":
			Login.signup_event(e);
			break;
		case "not-registered":
			e.preventDefault();
			route(e.target.href);
			break;
	}
});

document.route = route;
document.logout = Login.logout;
