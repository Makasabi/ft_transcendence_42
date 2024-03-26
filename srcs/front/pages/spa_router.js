import { footer, header_in, home } from "/front/pages/home/home.js";
import * as Login from "/front/pages/login/login.js";
import { me } from "/front/pages/user_mgt/user_mgt.js";

	/*** Utilities ***/
export function route(path)
{
	window.history.pushState({}, "", path);
	handleLocation();
}

export async function handleLocation() {
	update_header();

	// Change main content
	const routes = [
		{path : "/login", view : Login.login_render},
		{path : "/signup", view : Login.signup_render},
		{path : "/home", view : home},
		{path : "/me", view : me},
		{path : "/username", view : Login.username_render},
	];

	const list_params = new URLSearchParams(window.location.search);
	if (window.location.pathname === "/username" && list_params.get('code'))
	{
		console.log("URL with queries");
		await Login.forty2_signup();
		return ;
	}
	try 
	{
		const log = await Login.is_logged();
		if (!log && !["/login", "/signup", "/username"].includes(window.location.pathname))
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
			match[0].view().then(html => {
				document.querySelector("main").innerHTML = html;
			});
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
	switch (e.target.id)
	{
		case "submit-login":
			Login.login_event(e);
			break;
		case "submit-signup":
			Login.signup_event(e);
			break;
		case "forty2-auth-btn":
			Login.forty2_signup_event(e);
			break;
		case "submit-username":
			Login.username_event(e);
			break;
		case "not-registered":
			e.preventDefault();
			route(e.target.href);
			break;
	}
});

document.route = route;
document.logout = Login.logout;
