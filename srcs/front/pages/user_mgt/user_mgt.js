import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";

export function getProfileInfos(html, user) {
	let avatarUrl = user.avatar_file ? user.avatar_file : "/static/images/default_avatar.png";
	console.log("Avatar: ", avatarUrl);
	html = html.replace("{{avatar}}", avatarUrl);
	html = html.replace("{{username}}", user.username);
	html = html.replace("{{email}}", user.email);
	html = html.replace("{{rank}}", user.global_rank);
	return html;
}

export function getHistoryStats(html, user)
{
	let historyTable = '';
	for (let i = 0; i < user.game_history.length; i++) {
		const game = user.game_history[i];
		// Include a unique identifier for each game row
		const gameId = `game_${i}`;
		historyTable += `
			<tr id="${gameId}">
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



async function displayGamePlayers (players, playersList) {

	players.forEach(player => {
		const playerItem = document.createElement('li');
		playerItem.classList.add('player-item');

		const rankElement = document.createElement('span');
		rankElement.textContent = `Rank: ${player.rank}`;

		const avatarElement = document.createElement('img');
		avatarElement.src = player.avatar_file;
		avatarElement.alt = player.username;
		avatarElement.classList.add('small_avatar_img');

		const usernameElement = document.createElement('span');
		usernameElement.textContent = `${player.username}`;

		playerItem.appendChild(rankElement);
		playerItem.appendChild(avatarElement);
		playerItem.appendChild(usernameElement);

		playersList.appendChild(playerItem);
	});
}


export function displayGameBox(user) {
	const historyTableBody = document.getElementById('history_table_body');

	historyTableBody.addEventListener("click", async (event) => {

		const clickedRow = event.target.closest('tr');
			if (!clickedRow) return;
		const gameIndex = parseInt(clickedRow.id.split('_')[1]);

		const foregroundBox = document.createElement('div');
		foregroundBox.classList.add('game-box');
		document.body.appendChild(foregroundBox);

		const gameContainer = document.createElement('div');
		gameContainer.classList.add('game-container');

		const playersTitle = document.createElement('h3');
		playersTitle.classList.add('box-title');
		playersTitle.textContent = "Players in the Game";
		gameContainer.appendChild(playersTitle);

		const playersList = document.createElement('ul');
		let players = await fetch("/api/game/get_players/" + user.game_history[gameIndex].game_id, {
			headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
		}).then(response => response.json());
		// console.log("players: ", players);

		displayGamePlayers (players, playersList);

		gameContainer.appendChild(playersList);
		foregroundBox.appendChild(gameContainer);

		const closeForegroundBox = function (event) {
			if (!foregroundBox.contains(event.target)) {
				foregroundBox.remove();
				document.removeEventListener('click', closeForegroundBox);
			}
		};
		document.addEventListener('click', closeForegroundBox);

	});
}

// @TODO
// is user/username == me, redir route to /me

// img upload : format security