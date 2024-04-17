import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";

export function getProfileInfos(html, user) {
	let avatarUrl = user.avatar_file ? user.avatar_file : "/static/images/default_avatar.png";
	html = html.replace("{{avatar}}", avatarUrl);
	html = html.replace("{{username}}", user.username);
	html = html.replace("{{email}}", user.email);
	html = html.replace("{{rank}}", user.global_rank);
	return html;
}

export async function getHistoryStats(html, user)
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

	html = displayStatsBars(html, user);
	return html;
}

async function displayStatsBars(html, user) {
	let gamesPlayed = user.game_history.length;
	let gamesWon = user.game_history.filter(game => game.rank.split('/')[0] === '1').length;
	let tournamentsPlayed = user.game_history.filter(game => game.mode === 'Tournament').length;
	let tournamentWins = user.game_history.filter(game => game.mode === 'Tournament' 
		&& game.rank.split('/')[0] === '1' && game.mode === 'Tournament').length;

	
	let gamesWinPercentage = gamesPlayed === 0 ? 0 : ((gamesWon / gamesPlayed) * 100).toFixed(2);
	let tournamentWinPercentage = tournamentsPlayed === 0 ? 0 : ((tournamentWins / tournamentsPlayed) * 100).toFixed(2);
	
	console.log("gamesWinPercentage", gamesWinPercentage);
	console.log("tournamentWinPercentage", tournamentWinPercentage);

	let gamesBarHTML = `<div class="win-bar" style="height: ${gamesWinPercentage}%; background-color: var(--primary-color);"></div>`;
	let tournamentBarHTML = `<div class="win-bar" style="height: ${tournamentWinPercentage}%; background-color: var(--primary-color);"></div>`;

	let startIndexGames = html.indexOf('<div class="bar" id="gamesBar">') + '<div class="bar" id="gamesBar">'.length;
	let modifiedHtml = html.slice(0, startIndexGames) + gamesBarHTML + html.slice(startIndexGames);
	
	let startIndexTournament = modifiedHtml.indexOf('<div class="bar" id="tournamentBar">') + '<div class="bar" id="tournamentBar">'.length;
	modifiedHtml = modifiedHtml.slice(0, startIndexTournament) + tournamentBarHTML + modifiedHtml.slice(startIndexTournament);

	return modifiedHtml;
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
		let players = await APIcall("/api/game/get_players/" + user.game_history[gameIndex].game_id);

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

export async function APIcall(route) {
	let data = await fetch (route, {
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json())
	// console.log(data);
	return data;
}