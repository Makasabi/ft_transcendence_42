export async function me()
{
	let html = await fetch("/front/pages/user_mgt/me.html").then(response => response.text());
	let user = await fetch("/api/user_management/me").then(response => response.json());

	// profile-infos

	html = html.replace("{{username}}", user.username);
	html = html.replace("{{email}}", user.email);
	html = html.replace("{{rank}}", 8);

	// history-stats
	html = getHistoryStats(html, user);
	
	return html;
}

export async function getHistoryStats(html, user)
{
	let historyTable = '';
	for (let game of user.game_history) {
		historyTable += `
		<tr>
		<td>${game.score}</td>
		<td>Normal</td>
		<td>Private</td>
		<td>${game.date_played}</td>
		</tr>
		`;
	}
	// console.log(historyTable);
	html = html.replace("{{history}}", historyTable);
	html = html.replace("{{games_played}}", user.game_history.length);
	return html;
}
