export async function me()
{
	let html = await fetch("/front/pages/user_mgt/me.html").then(response => response.text());
	let user = await fetch("/api/user_management/me").then(response => response.json());

	html = html.replace("{{username}}", user.username);
	html = html.replace("{{email}}", user.email);
	html = html.replace("{{rank}}", 8);

	return html;
}
