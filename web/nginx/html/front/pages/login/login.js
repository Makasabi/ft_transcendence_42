import { route } from "../spa_router.js";
import { IView } from "../IView.js";
import { APIcall } from "../user_mgt/userMgtUtils.js";

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
	return cookie ? cookie.split('=')[1] : null;
}

export function deleteCookie(name)
{
	if (getCookie(name) == null)
		return;
	document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

/*** Render ***/
export class FAView extends IView {
	static match_route(route)
	{
		return route === "/2FA";
	}
	async render()
	{
		let html = await fetch("/front/pages/login/2FA.html")
			.then(response => response.text())
		var bob = await fetch("/api/auth/totp_create/", {
			headers: { 'Authorization': `Token ${getCookie('token')}`}
		})
			.then(response => response.blob())
		html = html.replace("{{src}}", URL.createObjectURL(bob));
		document.querySelector("main").innerHTML = html;

		const submit_button = document.getElementById("submit-secret-code");
		if (submit_button === null)
			return ;

		submit_button.addEventListener("click", async e => {
			e.preventDefault();
			const token = document.getElementById("secret_code").value;
			if (token === "")
				return ;
			const data = await fetch("/api/auth/totp_verify/", {
				method: "POST",
				headers: {
					'Content-type' : 'application/json',
					'Authorization': `Token ${getCookie('token')}`},
				body: JSON.stringify({"token" : token}),
			})
				.then(response => {
					if (response.ok)
						return response.json();
					else
						return null;
				});
			if (!data)
				route("/login");
			route("/home");
		})
	}
}

export class UnloggedHeaderView extends IView {
	async render() {
		fetch("/front/pages/login/header.html")
			.then(response => response.text())
			.then(html => document.querySelector("header").innerHTML = html);
	}
}

export class Forty2View extends IView
{
	static match_route(route)
	{
		return route === "/forty2";
	}

	async render()
	{
		const list_params = new URLSearchParams(window.location.search);
		if (list_params.get('code'))
		{
			await forty2_callback();
			return ;
		}
	}
}

export class GoogleView extends IView
{
	static match_route(route)
	{
		return route === "/google";
	}
	async render()
	{
		const list_params = new URLSearchParams(window.location.search);
		console.log("Google response params: ");
		for (const [key, value] of list_params.entries()) {
		    console.log(`${key}: ${value}`);
		}
		await google_callback();
		return ;
	}
}

export class LoginView extends IView
{
	static match_route(route) {
		return route === "/login";
	}

	async render() {
		await fetch("/front/pages/login/login.html")
			.then(response => response.text())
			.then(html => document.querySelector("main").innerHTML = html);

		const input_username = document.getElementById("login_username");
		const input_password = document.getElementById("login_password");
		if (input_username === null)
			return ;
		if (input_password === null)
			return ;
		input_username.focus();

		const log_button = document.getElementById("submit-login");
		if (log_button === null)
			return ;
		log_button.addEventListener("click", login_event);

		input_username.onkeydown = function(e) {
			if (e.key === 'Enter')
				e.preventDefault();
		};

		input_password.onkeydown = function(e) {
			if (e.key === 'Enter')
				e.preventDefault();
		};

		input_username.onkeyup = function(e) {
			if (e.key === 'Enter') {  // enter, return
				log_button.click();
			}
		};
		input_password.onkeyup = function(e) {
			if (e.key === 'Enter') {  // enter, return
				log_button.click();
			}
		};

		const google_button = document.getElementById("google-auth-btn");
		if (google_button === null)
			return ;
		google_button.addEventListener("click", (e) => {
			e.preventDefault();
			google_signup_event(e);
		});

		const forty2_button = document.getElementById("forty2-auth-btn");
		if (forty2_button === null)
			return ;
		forty2_button.addEventListener("click", forty2_signup_event);
	}
}

export class SignupView extends IView
{
	static match_route(route) {
		return route === "/signup";
	}

	async render() {
		await fetch("/front/pages/login/signup.html")
			.then(response => response.text())
			.then(html => document.querySelector("main").innerHTML = html);

		const input_email = document.getElementById("signup_email");
		if (input_email === null)
			return ;
		input_email.focus();

		const signup_button = document.getElementById("submit-signup");
		if (signup_button === null)
			return ;
		signup_button.addEventListener("click", signup_event);

		const not_registered = document.getElementById("not-registered");
		if (not_registered === null)
			return ;
		not_registered.addEventListener("click", (e) => {
			e.preventDefault();
			route("/login");
		});
	}
}

export class UsernameView extends IView
{
	static match_route(route)
	{
		const regex = /^\/username\b/;
		if (route.match(regex))
		{
			return true;
		}
		return false;
	}

	async render()
	{
		const regex = /^\/username\/([^\/]+)$/;
		const match = window.location.pathname.match(regex);
		if (!match)
		{
			route("/login");
			return ;
		}
		console.log("rendering username view");
		await fetch("/front/pages/login/username.html")
			.then(response => response.text())
			.then(html => document.querySelector("main").innerHTML = html);
		const username_button = document.getElementById("submit-username");
		if (username_button === null)
			return ;
		username_button.dataset.auth = match[1];
		username_button.addEventListener("click", username_event);
	}
}

				/*** Log ***/
export function logout()
{
	deleteCookie("token");
	deleteCookie("Googletoken");
	deleteCookie("42token");
	route("/login");
}

export async function is_logged()
{
	const token = getCookie('token');

	if (!token)
		return false;
	const ret = fetch('/api/auth/', {
		method: 'GET',
		headers: { 'Authorization': `Token ${token}` }
	}).then(response => {
		if (response.ok)
			return true;
		throw new Error(response.statusText);
	}).catch(error => {
		//console.error("Login failed:", error);
		return false;
	});
	return await ret;
}

async function login(username, password)
{
	const result = await fetch('/api/auth/login/', {
			method: 'POST',
			headers: {
				'Content-type' : 'application/json',
			},
			body: JSON.stringify({ 'username' : username , 'password' : password })
		})
		.then(response => {
			if (response.ok)
				return (response.json());
			return response.json().then(data => {
				throw new Error(data.error);
			});
		})
		.then(async data => {
			console.log("token: ", data.token);
			console.log("user: ", data.user);
			console.log("2FA : ", data.user["twoFA"]);
			setCookie("token", data.token, 1);
			if (data.user["twoFA"] === true)
				route("/2FA");
			else
				route("/home");
			return true;
		})
		.catch(error => {
			//console.error(error);
			let login_error = document.getElementById("login_error");
			let login_password = document.getElementById("login_password");

			if (login_error === null)
				return false;
			if (login_password === null)
				return false;

			login_error.hidden = false;
			login_password.value = "";
			return false;
		});
	return result;
}

async function signup(username, password, email)
{
	console.log("EMAIL : ", email);
	await fetch('/api/auth/signup/',
		{
			method: 'POST',
			headers: { 'Content-type' : 'application/json' },
			body: JSON.stringify({ 'username' : username , 'password' : password , 'email' : email})
		})
		.then(response =>
		{
			if (response.ok)
				return (response.json());
			else
			{
				return response.json().then(data => {
					console.error("Signup:", data.error);
					const error_field = document.getElementById("signup_error");
					if (error_field === null)
						return ;
					error_field.textContent = data.error;
					error_field.hidden = false;
					throw new Error('Wrong registration');
				});
			}
		})
		.then(async data =>
		{
			if (!data)
				return ;
			else
			{
				console.log("Registration successful!");
				// console.log("token : ", data.token);
 				// console.log("user : ", data.user);
				setCookie("token", data.token, 1);
				await route("/home");
			}
		})
		.catch(error => {
			console.error(error);
		});
}

export async function google_callback()
{
	const auth = await google_authentication();
	console.log("auth : ", auth);
	if (!auth)
	{
		route("/login");
		return ;
	}

	const email = await getEmailFromGoogle();
	console.log("email from api : ", email);
	if (!email)
	{
		route("/login");
		return;
	}
	try
	{
		const reg = await is_registered(email);
		switch (reg)
		{
			case 1:
				route("/2FA");
				break;
			case 2:
				route("/home");
				break;
			case 3:
				route("/username/forty2");
				break;
		}
	}
	catch(error)
	{
		console.error(error);
		route("/login");
	}
}

export async function google_authentication()
{
	const list = new URLSearchParams(window.location.search);
	const authCode = list.get('code');
	const state = list.get('state');
	const cookie_state = getCookie('Googlestate');
	deleteCookie('Googlestate');
	if (cookie_state !== state)
	{
		console.error('State received my API server does not match state sent');
		return false;
	}
	try
	{
		const data = await fetch("/api/auth/google_auth/", {
			method : "POST",
			headers: {'Content-type' : 'application/json'},
			body: JSON.stringify({
				"code" : authCode,
				"state" : state,
				})
			})
			.then(response => {return response.json();});
		if (data.error)
			throw new Error(data.error);

		console.log(data);
		console.log("Googletoken: ", data.access_token);
		setCookie("Googletoken", data.access_token, 1);
		return true;
	}
	catch(error)
	{
		console.log(error);
		return false;
	}
}

export async function forty2_callback()
{
	const auth = await forty2_authentication();
	console.log("auth : ", auth);
	if (!auth)
	{
		route("/login");
		return ;
	}

	const email = await getEmailFrom42();
	console.log("email from api : ", email);
	if (!email)
	{
		route("/login");
		return;
	}
	try
	{
		const reg = await is_registered(email);
		switch (reg)
		{
			case 1:
				route("/2FA");
				break;
			case 2:
				route("/home");
				break;
			case 3:
				route("/username/forty2");
				break;
		}
	}
	catch(error)
	{
		console.error(error);
		route("/login");
	}
}

export async function forty2_authentication()
{
	const list = new URLSearchParams(window.location.search);
	const authCode = list.get('code');
	const state = list.get('state');
	const cookie_state = getCookie('42state');
	deleteCookie('42state');
	if (cookie_state !== state)
	{
		console.error('State received my API server does not match state sent');
		return false;
	}
	try
	{
		const data = await fetch("/api/auth/forty2_auth/", {
			method : "POST",
			headers: {'Content-type' : 'application/json'},
			body: JSON.stringify({
				"code" : authCode,
				"state" : state,
				})
			})
			.then(response => {return response.json();});
		if (data.error)
			throw new Error(data.error);

		console.log(data);
		console.log("42token: ", data.access_token);
		setCookie("42token", data.access_token, 1);
		return true;
	}
	catch(error)
	{
		console.log(error);
		return false;
	}
}


				/*** Events ***/
export async function google_signup_event(e)
{
	e.preventDefault();
	console.log("google event");
	const uid = '646881961013-bgo5lf3ru7bc1869b12ushtq3q2irgah.apps.googleusercontent.com';
	const state = generateRandomString(15);
	const redirect_uri = 'https://localhost:8080/google';
	const scope = 'email profile';
	const authURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${uid}&redirect_uri=${redirect_uri}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
	setCookie('Googlestate', state, 1);
	window.location.href=authURL;
}

export async function forty2_signup_event(e)
{
	const uid = "u-s4t2ud-778802c450d2090b49c6c92d251ff3d1fbb51b03a9284f8f43f5df0af1dae8fa";
	const state = generateRandomString(15);
	const authURL = `https://api.intra.42.fr/oauth/authorize?client_id=${uid}&redirect_uri=https%3A%2F%2Flocalhost%3A8080%2Fforty2&response_type=code&state=${state}`
	setCookie('42state', state, 1);
	window.location.href=authURL;
}

export async function login_event(e)
{
	e.preventDefault();
	const form = document.getElementById("login-form");
	if (form === null)
		return ;
	const username = form.elements.login_username.value;
	const password = form.elements.login_password.value;

	const log = await login(username, password);
	//if (!log)
	//	route("/login");
}

export async function signup_event(e)
{
	e.preventDefault();
	const form = document.getElementById("signup-form");
	if (!form.checkValidity())
		return ;

	const username = form.elements.signup_username.value;
	const password = form.elements.signup_password.value;
	const email = form.elements.signup_email.value;
	if (username === "" || password === "" || email === "")
		return ;
	signup(username, password, email);
}

export async function username_event(e)
{
	e.preventDefault();
	const form = document.getElementById("username-form");
	if (!form.checkValidity())
		return ;
	const username = form.elements.signup_username.value;
	const username_button = document.getElementById("submit-username");
	if (username_button === null)
		return ;
	let email = null;
	if (username_button.dataset.auth === "google")
		email = await getEmailFromGoogle();
	else if (username_button.dataset.auth === "forty2")
		email = await getEmailFrom42();
	if (!email)
	{
		route("/login");
		return;
	}
	const password = generateRandomString(15);
	signup(username, password, email);
}


				/*** Utilities ***/
export async function is_registered(email)
{
	const result = await fetch('/api/auth/is_registered/', {
		method: 'POST',
		headers: {	'Content-type' : 'application/json'},
		body: JSON.stringify({ 'email' : email }),
	})
	.then(response => {
		if (response.ok)
			return (response.json().then(data => {
				setCookie("token", data['token'], 1);
				console.log('user from is reg : ', data['user']);
				if (data['user']['twoFA'] === true)
					return 1
				return 2;
			}));
		else if (response.status === 401)
		{
			return response.json().then(data => {
				console.log("Not registered");
				return 3;
			});
		}
		throw new Error("Error in registration");
	})
	.catch(error => {
		throw new Error(error);
		return 3;
	})
	return result;
}

function generateRandomString(length)
{
	const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let randomString = '';
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		randomString += charset.charAt(randomIndex);
	}
	return randomString;
}

//async function getEmailFrom42()
//{
//	const data = await fetch("https://api.intra.42.fr/v2/me", {
//		method : "GET",
//		headers: {
//			'Authorization' : `Bearer ${getCookie("42token")}`
//		}})
//		.then(response => {
//			if (!response.ok)
//				throw new Error(response.json());
//			return response.json();
//		})
//		.catch(error => {
//			console.error('ERROR DE 42 : ', error);
//			return null;
//	});
//	console.log("data from 42 :" , data);
//	if (data == null)
//		return null;
//	return data.email;
//}

async function getEmailFrom42()
{
	const data = await fetch("/api/auth/get_42_mail/", {
		method : "GET",
		headers: {
			'Authorization' : `Bearer ${getCookie("42token")}`
		}})
		.then(response => response.json())
	console.log("data from 42 :" , data);
	if (data == null)
		return null;
	return data.email;
}

async function getEmailFromGoogle()
{
	const data = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
		method : "GET",
		headers: {
			'Authorization' : `Bearer ${getCookie("Googletoken")}`
		}})
		.then(response => {
			if (!response.ok)
				throw new Error(response.json());
			return response.json();
		})
		.catch(error => {
			console.error(error);
			return null;
	});
	console.log("data from Google :" , data);
	if (data == null)
		return null;
	return data.email;
}
