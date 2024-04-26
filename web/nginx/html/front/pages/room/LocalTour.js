import { IView } from "../IView.js";
import { route } from "../spa_router.js";
export class LocalTourView extends IView {
	static match_route(route)
	{
		return route === "/local_tournament";
	}
	async render()
	{
		const html = await fetch("/front/pages/room/LocalTour.html")
			.then(response => response.text())
		document.querySelector("main").innerHTML = html;
		const add_button = document.getElementById("submit_alias");
		const start_button = document.getElementById("start_local_tour");

		add_button.addEventListener("click", add_player);
		start_button.addEventListener("click", event => {
			event.preventDefault();
			const list = document.getElementById('tour_players');
			const players = list.querySelectorAll('li');
			if (players.length < 3)
				return;

			console.log("Players before : ", typeof(players));
			start_tournament(Array.from(players).map(li => li.querySelector('h3').textContent));
		});
	}
}

function add_player(event)
{
	event.preventDefault();
	const nb_error = document.getElementById('alias_error');
	const doublon_error = document.getElementById('alias_doublon');

	const list = document.getElementById('tour_players');
	const nb_players = list.querySelectorAll('li').length;
	if (nb_players >= 8)
	{
		nb_error.hidden = false;
		return;
	}

	const input = document.getElementById('player_alias');
	if (check_doublon(input.value))
	{
		doublon_error.hidden = false;
		return;
	}

	const li = document.createElement('li');
	const text = document.createElement('h3');
	text.textContent = input.value;
	li.appendChild(text);
	list.appendChild(li);

	li.addEventListener('contextmenu', e => {
		e.preventDefault();
		li.remove();
	})

	nb_error.hidden = true;
	doublon_error.hidden = true;

	input.value = "";
}

function check_doublon(string)
{
	const list = document.getElementById('tour_players').querySelectorAll('li');
	for (const li of list)
	{
		const text = li.querySelector('h3');
		if (text && string === text.textContent)
			return true;
	}
	return false;
}

function start_tournament(players)
{
	// route('/game_local')

	const schedule = roundRobin(players);
	localStorage.setItem('schedule', JSON.stringify(schedule));
//	const test = JSON.parse(localStorage.getItem('schedule'));
//	localStorage.clear();
	route("/waiting_room");

	return;
}

function roundRobin(players)
{
	let numPlayers = players.length;
    const schedule = [];

    if (numPlayers % 2 !== 0)
	{
        players.push(null);
		numPlayers += 1;
	}
    for (let i = 0; i < numPlayers - 1; i++)
	{
        const mid = Math.floor(numPlayers / 2);
        const l1 = players.slice(0, mid);
        const l2 = players.slice(mid).reverse();

		const round = {
            id: i + 1,
            matches: []
        };
        for (let j = 0; j < mid; j++) {
            round.matches.push({
				id : j + 1,
				players : [l1[j], l2[j]],
				winner : null
			});
        }
        schedule.push(round);

        players.splice(1, 0, players.pop());
    }
    return schedule;
}
