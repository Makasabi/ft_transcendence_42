import { route } from "/front/pages/spa_router.js"

export async function header_out()
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

export async function login_event(e)
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
				return response.json().then(data => {
					throw new Error(data.error);
				});
			}
		})
		.then(data => {
			console.log("token: ", data.token);
			console.log("user: ", data.user);
			document.cookie = `token=${data.token}`;
			route("/home");
			return true;
		})
		.catch(error => {
			console.error(error);
		});
}

export async function signup_event(e)
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
