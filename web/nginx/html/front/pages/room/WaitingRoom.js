import { IView } from "../IView.js";
import { route } from "../spa_router.js";
import { createLocalGame } from "../game/local_game_utils.js";

/************************************
 *	SCHEDULE FORMAT
 *
 *	schedule = [
 *	{
 *		'id' : id,
 *		'matches' : [
 *			{
 *				'id' : id,
 *				'players' : ['player1', 'player2'],
 *				'winner' : null
 *			}
 *			{
 *				...
 *			}
 *		]
 *	}
 *	{
 *		...
 *	}]
************************************/

export class WaitingRoomView extends IView {
	static match_route(route)
	{
		return route === "/waiting_room";
	}

	async render()
	{
		const schedule = JSON.parse(localStorage.getItem('schedule'));
		if (schedule === null)
		{
			console.log("error with local storage");
			route("/local_tournament");
			return;
		}
		console.log("schedule : ", schedule);

		const state = getCurrentRoundAndGame(schedule);
		if (state === null)
		{
			console.log("Tournament is over");
			route("/local_tournament");
			return;
		}
		const round = state.currentRound;
		const match = state.currentGame;

		let html = await fetch("/front/pages/room/WaitingRoom.html")
		.then(response => response.text())
		document.querySelector("main").innerHTML = html;

		drawLocalRounds(schedule, state);
		displayCurrentRoundGames(schedule, state);
		displayARoundGames(schedule);

		document.getElementById('start_game').addEventListener('click', async e => {
			e.preventDefault();
			console.log("Game starting");

			const game_id = await createLocalGame(match.players[1], match.players[0]);
			if (game_id === undefined) {
				return;
			}
			route(`/game/${game_id}`);
			return;

			/* Game simulation for testing purpose */
	//		const schedule = JSON.parse(localStorage.getItem('schedule'));
	//		if (schedule === null)
	//		{
	//			console.log("error with local storage");
	//			route("/local_tournament");
	//			return;
	//		}

	//		const state = getCurrentRoundAndGame(schedule);
	//		if (state === null)
	//		{
	//			console.log("Tournament is over");
	//			route("/local_tournament");
	//			return;
	//		}
	//		const match = state.currentGame;
	//		if (Math.random() < 0.5)
	//			match.winner = match.players[0];
	//		else
	//			match.winner = match.players[1];
	//		console.log("Changed schedule : ", schedule);
	//		localStorage.setItem('schedule', JSON.stringify(schedule));
	//		route("/waiting_room");
	//		return;
		})
	}
}

export function getCurrentRoundAndGame(schedule)
{
	for (let i = 0; i < schedule.length; i++)
	{
		const round = schedule[i];

		for (let j = 0; j < round.matches.length; j++)
		{
			const match = round.matches[j];
			if (match.winner === null || match.winner === undefined) {
				console.log("current round : ", round.id);
				console.log("current game : ", match);
				return { currentRound: round.id, currentGame: match };
			}
		}
	}
	return null;
}

function drawLocalRounds(schedule, state)
{
	const current_round = state.currentRound;

	let rounds = document.getElementById('local_rounds_map');

	console.log("rounds : ", rounds);

	for (let i = 0; i < schedule.length; i++)
	{
		const round = schedule[i];
		const round_div = document.createElement('div');
		round_div.classList.add('round_style');
		const round_nu = document.createElement('h3');
		round_nu.innerHTML = round.id;
		round_div.id = `round${round.id}`;
		const round_img = document.createElement('img');
		round_img.src = "/front/ressources/img/svg/hexagon.svg";
		round_img.id = `img_round_${round.id}`;
		if (round.id === current_round){
			round_div.classList.add('current_round');
			round_nu.style.color = "var(--contrast)";
		}

		round_div.appendChild(round_nu);
		round_div.appendChild(round_img);
		rounds.appendChild(round_div);
	}
}

function roundGames(round) {

	let tablebody = document.getElementById('local_tour_game_table')
	let winner;

	let table = '';
	for (let i = 0; i < round.matches.length; i++)
	{
		winner = round.matches[i].winner;
		if (winner === null) {
			const game = round.matches[i];
			table += `<tr id="game_${game.id}">`;
			table += `<td>${i + 1}</td>`;
			table += `<td>${game.players[0]}</td>`;
			table += `<td>${game.players[1]}</td>`;
			table += `</tr>`;
		}
		else {
			const game = round.matches[i];
			table += `<tr id="game_${game.id}">`;
			table += `<td>${i + 1}</td>`;
			if (winner === game.players[0]) {
				table += `<td><img id="crown" src="/front/ressources/img/svg/icons/crown.svg" alt="Winner"> ${game.players[0]}</td>`;
				table += `<td>${game.players[1]}</td>`;
			}
			else {
				table += `<td>${game.players[0]}</td>`;
				table += `<td><img id="crown" src="/front/ressources/img/svg/icons/crown.svg" alt="Winner"> ${game.players[1]}</td>`;
			}
			table += `</tr>`;
		}
	}
	tablebody.innerHTML = table;
}

function displayCurrentRoundGames(schedule, state) {

	const current_round = state.currentRound;
	const round = schedule[current_round - 1]
	roundGames(round, current_round - 1);

	const match = state.currentGame;
	let player_1 = document.getElementById('player_1');
	let player_2 = document.getElementById('player_2');
	let player_1_name = document.createElement('div')
	player_1_name.innerHTML = match.players[0];
	player_1.appendChild(player_1_name);
	let player_2_name = document.createElement('div');
	player_2_name.innerHTML = match.players[1];
	player_2.appendChild(player_2_name);
}

function displayARoundGames(schedule) {

	let round_map = document.getElementById("local_rounds_map");

	round_map.addEventListener('click', async e => {
		let round_id = e.target.id;
		if (round_id === "undefined")
			return;
		let round_number = round_id.split('_')[2];
		const regex = new RegExp('[0-9]+$');
		let test = regex.test(round_number);
		if (round_number === "undefined" || test === false ) {
			return;
		}
		let round = schedule[round_number - 1];
		roundGames(round);
	});
}
