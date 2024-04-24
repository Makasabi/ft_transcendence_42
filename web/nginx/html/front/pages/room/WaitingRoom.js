import { IView } from "../IView.js";
import { route } from "../spa_router.js";

/*	SCHEDULE FORMAT	
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
*/

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
			console.error("Pb with state");
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

		document.getElementById('start_game').addEventListener('click', e => {
			e.preventDefault();
			console.log("Game starting");
			return;
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
            if (match.winner === null || match.winner === undefined)
                return { currentRound: round.id, currentGame: match };
        }
    }
    return null;
}
