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
		html = html.replace("{{round}}", round);
		html = html.replace("{{player1}}", match.players[0]);
		html = html.replace("{{player2}}", match.players[1]);
		document.querySelector("main").innerHTML = html;

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

function getCurrentRoundAndGame(schedule)
{
    for (let i = 0; i < schedule.length; i++)
	{
        const round = schedule[i];
        
        for (let j = 0; j < round.matches.length; j++)
		{
            const match = round.matches[j];
			if (match.winner === null && !match.players.some(str => str === null))
                return { currentRound: round.id, currentGame: match };
        }
    }
    return null;
}
