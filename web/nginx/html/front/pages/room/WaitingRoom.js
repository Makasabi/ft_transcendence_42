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

		html = html.replace("{{round}}", round);
		html = html.replace("{{player1}}", match.players[0]);
		html = html.replace("{{player2}}", match.players[1]);

		document.getElementById('start_game').addEventListener('click', async e => {
			e.preventDefault();
			console.log("Game starting");

			const game_id = await createLocalGame(match.players[0], match.players[1]);
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
		if (round.id === current_round){
			round_div.classList.add('current_round');
			round_nu.style.color = "var(--contrast)";
		}
		
		round_div.appendChild(round_nu);
		round_div.appendChild(round_img);
		rounds.appendChild(round_div);
	}
}

function displayCurrentRoundGames(schedule, state) {
	// displays the details of the current round in a table format
	// the current round is the one diosplayed in the div.
	// an event listener is on the round images to display the games of the round

	let tablebody = document.getElementById('local_tour_game_table')
	const current_round = state.currentRound;
	console.log("current_round : ", current_round);



	const round = schedule[current_round - 1]
	console.log("round : ", round);

	let table = '';
	for (let i = 0; i < round.matches.length; i++)
	{
		console.log("match : ", round.matches[i]);
		const game = round.matches[i];
		table += `<tr id="game_${game.id}">`;
		table += `<td>${game.id}</td>`;
		table += `<td>${game.players[0]}</td>`;
		table += `<td>${game.players[1]}</td>`;
		table += `</tr>`;
	}
	tablebody.innerHTML = table;
}
