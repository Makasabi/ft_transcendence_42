import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";

export function getProfileInfos(html, user) {
	html = html.replace("{{avatar}}", user.avatar_file);
	html = html.replace("{{username}}", user.username);
	html = html.replace("{{email}}", user.email);
	html = html.replace("{{rank}}", user.global_rank);
	return html;
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

	html = html.replace("{{history}}", historyTable);
	html = html.replace("{{games_played}}", user.game_history.length);
	html = html.replace("{{games_won}}", user.game_history.filter(game => game.rank.split('/')[0] === '1').length);
	html = html.replace("{{tournament_played}}", user.game_history.filter(game => game.mode === 'Tournament').length);
	html = html.replace("{{tournament_wins}}",
		user.game_history.filter(game => game.rank.split('/')[0] === '1' && game.mode === 'Tournament').length);
	return html;
}

