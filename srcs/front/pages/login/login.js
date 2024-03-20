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
