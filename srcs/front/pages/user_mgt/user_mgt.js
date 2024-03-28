import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";

export class MeView extends IView {
	static match_route(route) {
		return route === "/me";
	}

	static async render() {
		let html = await fetch("/front/pages/user_mgt/me.html").then(response => response.text());
		let user = await fetch("/api/user_management/me", {
			headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
		}).then(response => response.json());
		console.log("user", user);

		// profile-infos
		html = html.replace("{{avatar}}", user.avatar_file);
		html = html.replace("{{username}}", user.username);
		html = html.replace("{{email}}", user.email);

		// global rank
		// getGlobalRank(html, user);

		html = html.replace("{{rank}}", user.global_rank);

		// history-stats
		html = getHistoryStats(html, user);

		console.log(user.avatar_file);
		//console.log("html", html);

		document.querySelector("main").innerHTML = html;

		document.getElementById("edit-button").addEventListener("click", () => {
			console.log("edit-button clicked");
		});
	}
}

export function getHistoryStats(html, user)
{
	let historyTable = '';
	for (let game of user.game_history) {
		historyTable += `
		<tr>
		<td>${game.rank}</td>
		<td>${game.mode}</td>
		<td>${game.visibility}</td>
		<td>${game.date_played}</td>
		</tr>
		`;
	}
	console.log(user.game_history);
	// console.log(historyTable);
	html = html.replace("{{history}}", historyTable);
	html = html.replace("{{games_played}}", user.game_history.length);
	html = html.replace("{{games_won}}", user.game_history.filter(game => game.rank.split('/')[0] === '1').length);
	html = html.replace("{{tournament_played}}", user.game_history.filter(game => game.mode === 'Tournament').length);
	html = html.replace("{{tournament_wins}}",
		user.game_history.filter(game => game.rank.split('/')[0] === '1' && game.mode === 'Tournament').length);
	return html;
}
