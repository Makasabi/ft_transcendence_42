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

export async function signup()
{
	return await fetch("/front/pages/login/signup.html").then(response => response.text());
}

export async function login()
{
	return await fetch("/front/pages/login/login.html").then(response => response.text());
}


				/*** Utilities ***/
export function logout()
{
	deleteCookie("token");
	route("/login");
}

export async function is_logged()
{
	const token = getCookie('token');
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

				/*** Events ***/
export async function login_event(e)
{
	e.preventDefault();
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
}

export async function signup_event(e)
{
	//e.preventDefault();

	const form = document.getElementById("signup-form");
	if (!form.checkValidity())
		return ;

	e.preventDefault();
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
				return response.json().then(data => {
					console.error(data.error);
					throw new Error('Wrong registration');
				});
			}
		})
		.then(data => {
			if (!data)
				return ;
			else
			{
				console.log("Registration successfull!");
				console.log("token : ", data.token);
				console.log("user : ", data.user);
				route("/login");
			}
		})
		.catch(error => {
			console.error(error);
		});
}

export async function forty_login_event(e)
{
	// retreive id from somewere else like backend
	const uid = "u-s4t2ud-778802c450d2090b49c6c92d251ff3d1fbb51b03a9284f8f43f5df0af1dae8fa";
	const redirUri = 'http://localhost:8000';
	const authURL = `https://api.intra.42.fr/oauth/authorize?client_id=${uid}&redirect_uri=${redirUri}&response_type=code`;
	window.location.href = authURL;
}
