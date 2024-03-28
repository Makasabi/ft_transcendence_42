import { route } from "/front/pages/spa_router.js"

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


				/*** Render ***/
export async function header_log()
{
	return await fetch("/front/pages/login/header.html").then(response => response.text());
}

export async function signup_render()
{
	return await fetch("/front/pages/login/signup.html").then(response => response.text());
}

export async function login_render()
{
	return await fetch("/front/pages/login/login.html").then(response => response.text());
}

export async function username_render()
{
	return await fetch("/front/pages/login/username.html").then(response => response.text());
}


				/*** Log ***/
export function logout()
{
	deleteCookie("token");
	route("/login");
}

export async function is_logged()
{
	const token = getCookie('token');
	console.log("Token before check : ", token);
	try { 
		const response = await fetch('api/auth/', {
			method: 'GET',
			headers: { 'Authorization': `Token ${token}` }
		});
		if (response.ok)
			return true;
		else
			return false;
	}
	catch(error)
	{
		console.error('Fetch error: ', error);
		return false;
	}
}

async function login(username, password)
{
	const result = await fetch('api/auth/login/', {
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
				return response.json().then(data => {
					throw new Error(data.error);
				});
			}
		})
		.then(data => {
			console.log("token: ", data.token);
			console.log("user: ", data.user);
			setCookie("token", data.token, 1);
			route("/home");
			return true;
		})
		.catch(error => {
			console.error(error);
			return false;
		});
	return result;
}

async function signup(username, password, email)
{
	await fetch('api/auth/signup/',
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
				return response.json().then(data =>
				{
					console.error(data.error);
					throw new Error('Wrong registration');
				});
			}
		})
		.then(data =>
		{
			if (!data)
				return ;
			else
			{
				console.log("Registration successfull!");
				console.log("token : ", data.token);
				console.log("user : ", data.user);
				setCookie("token", data.token, 1);
				route("/home");
			}
		})
		.catch(error => {
			console.error(error);
		});
}

export async function google_signup()
{
	const auth = google_authentication();
	route('/login');
	return ;
}

export async function forty2_signup()
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
		if (!reg)
			route("/username")
		else
			route("/home");
	}
	catch(error)
	{
		console.error(error);
		route("/login");
	}
}

export async function is_registered(email)
{
	const result = await fetch('api/auth/is_registered/', {
		method: 'POST',
		headers: {	'Content-type' : 'application/json'},
		body: JSON.stringify({ 'email' : email }),
	})
	.then(response => {
		if (response.ok)
			return (response.json().then(data => {
				setCookie("token", data['token'], 1);
				console.log("User registered : ", data['token']);
				return true;
			}));
		else if (response.status === 400)
		{
			return response.json().then(data => {
				console.log("Not registered");
				return false;
			});
		}
		else
			return response.json().then(data => {
				throw new Error("Error in registration");
			});
	})
	.catch(error => {
		throw new Error(error);
		return false;
	})
	return result;
}


				/*** Events ***/
export async function google_signup_event(e)
{
	e.preventDefault();
	console.log("google event");
	const uid = '646881961013-bgo5lf3ru7bc1869b12ushtq3q2irgah.apps.googleusercontent.com';
	const state = generateRandomString(15);
	const redirect_uri = 'http://localhost:8000/google';
	const scope = 'email profile';
	const authURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${uid}&redirect_uri=${redirect_uri}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
	setCookie('Googlestate', state, 1);
	window.location.href=authURL;
}

export async function forty2_signup_event(e)
{
	const uid = "u-s4t2ud-778802c450d2090b49c6c92d251ff3d1fbb51b03a9284f8f43f5df0af1dae8fa";
	const state = generateRandomString(15);
	const authURL = `https://api.intra.42.fr/oauth/authorize?client_id=${uid}&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fforty2&response_type=code&state=${state}`
	setCookie('42state', state, 1);
	window.location.href=authURL;
}

export async function login_event(e)
{
	e.preventDefault();
	const form = document.getElementById("login-form");
	const username = form.elements.login_username.value;
	const password = form.elements.login_password.value;

	const log = await login(username, password);
	if (!log)
		route("/login");
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
	signup(username, password, email); 
}

export async function username_event(e)
{
	e.preventDefault();
	const form = document.getElementById("username-form");
	const username = form.elements.signup_username.value;
	const email = await getEmailFrom42();
	const password = generateRandomString(15);
	signup(username, password, email);
}


				/*** Utilities ***/
export async function google_authentication()
{
	return true;
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
		const data = await fetch("api/auth/forty2_auth/", {
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

async function getEmailFrom42()
{
	const data = await fetch("https://api.intra.42.fr/v2/me", {
		method : "GET",
		headers: {
			'Authorization' : `Bearer ${getCookie("42token")}`
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
	console.log("data from 42 :" , data);
	return data.email;
}
