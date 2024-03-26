import * as Login from "/front/pages/login/login.js";

export async function me()
{
	let html = await fetch("/front/pages/user_mgt/me.html").then(response => response.text());
	let user = await fetch("/api/user_management/me", {
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json());
	
	console.log(user.error);
	console.log(user.data);
	html = html.replace("{{username}}", user.username);
	html = html.replace("{{email}}", user.email);
	return html;
}
