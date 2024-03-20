import { footer, header_in, home } from "/front/pages/home/home.js";
import { header_out, login, signup } from "/front/pages/login/login.js";
import { me } from "/front/pages/user_mgt/user_mgt.js";

let change_header = true;

/*** Utilities ***/
function route(path) {
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
	if (e.target.id === "submit-login")
	{
		e.preventDefault();
		console.log("login");
		const form = document.getElementById("login-form");
		const username = form.elements.login_username.value;
		const password = form.elements.login_password.value;

		await fetch('api/auth/login/', {
				method: 'POST',
				headers: {
					'Content-type' : 'application/json',
				},
				body: JSON.stringify({ 'username' : username , 'password' : password })
			})
			.then(response => {
				if (response.ok)
					return (response.json());
				else
				{
					console.log("Error from server");
					console.log(response.json());
					return (response.json());
				}

			})
			.then(data => {
				if (data == null)
					return;
				console.log("token: ", data.token);
				document.cookie = `token=${data.token}`;
				change_header = true;
				route("/home");
			});
	}
	else if (e.target.matches("[data-route]"))
	{
		e.preventDefault();
		route(e.target.href);
	}
	else if (e.target.id === "submit-signup")
	{
		e.preventDefault();
		console.log('register');

		const form = document.getElementById("signup-form");
		const username = form.elements.signup_username.value;
		const password = form.elements.signup_password.value;
		const email = form.elements.signup_email.value;

		await fetch('api/auth/signup/', {
				method: 'POST',
				headers: { 'Content-type' : 'application/json' },
				body: JSON.stringify({ 'username' : username , 'password' : password , 'email' : email})
			})
			.then(response => {
				if (response.ok)
					return (response.json());
				else
				{
					console.log(response.json());
					return (null);
				}
			})
			.then(data => {
				if (!data)
					return ;
				else
				{
					route("/login");
					console.log(data);
					console.log("Registration successfull");
				}
			});
	}
});

document.route = route;
document.logout = logout;
