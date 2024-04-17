/**
 * 
 * TODO:
 * Implement end of tournament
 * Improve display of rounds
 * Leave button
 * Display lives and usernames in game
 * optimize game when multiple games are running
 * 
 * Migration to deploy version
 * 
 * TESTING
 * 
 *
 * Only first round should accept less than 6 players
 *
 * Minimum 1 player shouild be eliminated in each game
 *
 *
 */

import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import { checkRoomCode } from "/front/pages/room/roomUtils.js";
import { getRoomInfo, getTournamentInfo, getRoundInfo, getRoundStartTime, fillRoundMap, displayMyPool, renamePools, displayAPool} from "./tournamentUtils.js";
import { createTournament } from "./tournamentUtils.js";

export class TournamentView extends IView {
	static match_route(route) {
		if (route.split("/")[1] === "tournament" && route.split("/")[2].length === 6 && route.split("/")[2] !== undefined) {
			return true;
		} else {
			return false;
		}
	}

	async render() {
		this.code = document.URL.split("/")[4];
		let roomExists = await checkRoomCode(this.code);
		if (roomExists === false) {
			route("/unknown");
			return;
		}
		this.roomInfo = await getRoomInfo(this.code)
		this.tournament = await getTournamentInfo(this.roomInfo.room_id)
		if (this.tournament === undefined) {
			console.error("Tournament not found")
			route("/unknown");
		}
		this.TournamentSocket = createTournamentSocket(this.tournament.id);

		/**
		 * ✅ check tournament code
		 * ✅ open websocket
		 * ✅ get room info
		 * get tournament info
		 * 		call the upddate function(back)
		 * 		returns tournament info + occupancy
		 * ✅ get round info
		 * ✅ display tournament page
		 * timer function
		 * 		start game
		 * call ping function (10s loop)
		 * 		websocket ping
		 * 		calls the update function in back
		 * 		websocket triggers update in front
		 */

		console.log("tournament current round: ", this.tournament.current_round)
		let roundInfo = await getRoundInfo(this.tournament.id, this.tournament.current_round)
		console.log("round information", roundInfo);

		let html = await fetch("/front/pages/room/tournament.html").then(response => response.text());
		document.querySelector("main").innerHTML = html;

		let pools = await renamePools(roundInfo.distribution);
		fillRoundMap(this.tournament, pools);
		displayMyPool(pools);
		displayAPool(pools);

		this.ping();
		this.updateNextRoundTimer();
		this.start_time = await getRoundStartTime(this.tournament.id, this.tournament.current_round);
		if (!this.start_time) {
			document.getElementById("next_round_timer").innerText = "No upcoming round";
			return;
		}
	}

	destroy() {
		console.log("Destroying tournament view");
		if (this.TournamentSocket) {
			this.TournamentSocket.close();
		}
	}

	async updateNextRoundTimer() {

		// let start_time = await getRoundStartTime(this.tournament.id, this.tournament.current_round);
		// if (!start_time) {
		// 	document.getElementById("next_round_timer").innerText = "No upcoming round";
		// 	return;
		// }
		let startTime = new Date(this.start_time);
		let currentTime = new Date();
		let timeRemaining = startTime - currentTime;

		if (timeRemaining <= 0) {
			const to_send = JSON.stringify({
				"type" : "ready_to_play",
				"message" : "ready to play",
			})
			this.TournamentSocket.send(to_send)
			document.getElementById("next_round_timer").innerText = "Round has started";
			return;
		}

		let minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
		let seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

		let formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		document.getElementById("next_round_timer").innerText = `Next round starting in ${formattedTime}`;
		setTimeout(this.updateNextRoundTimer.bind(this), 100);
	}
	
	async ping() {
		console.log("Pinging tournament socket");
		if (this.TournamentSocket.readyState === WebSocket.CLOSED
			|| this.TournamentSocket.readyState === WebSocket.CLOSING)
			return;
		this.TournamentSocket.send(JSON.stringify({
			"type": "ping",
		}));
		setTimeout(this.ping.bind(this), 20000);
	}
}


export function createTournamentSocket(tournament_id) {
	console.log("Creating tournament socket for tournament: ", tournament_id);
	const TournamentSocket = new WebSocket(
		'ws://'
		+ window.location.host
		+ '/ws/tournament/'
		+ tournament_id,
	);
	// console.log(TournamentSocket);

	TournamentSocket.onerror = function (e) {
		console.log('Tournament - Socket error', e);
		// route('/home');
	};

	TournamentSocket.onopen = function (e) {
		// console.log('Tournament - Socket successfully connected: ', e);

	};

	TournamentSocket.onclose = function (e) {
		console.log('Tournament - Socket closing:', e.code, e.reason);
		const code = e.code;
		const reason = e.reason;
		switch (code) {
			case 1000:
				console.log('Tournament - Socket closed normally.');
				break;
			case 3010:
				console.log('Tournament - Player not invited to tournament');
				route('/uninvited');
				break;
			case 3011:
				console.log('Tournament - Player was eliminated');
				route('/playerEliminated');
				break;
			default:
				console.log('Tournament - Socket closed unexpectedly:', code, reason);
		}
	};

	TournamentSocket.onmessage = function (e) {
		console.log('event : ', e);
		const data = JSON.parse(e.data);
		const type = data.type;
		switch (type) {
			// case "player_eliminated":
			// 	console.log("Player eliminated:", data);
			// 	playerEliminated(data);
			// 	break;
			// case "round_start":
			// 	console.log("Round starting:", data);
			// 	break;
			// case "round_end":
			// 	console.log("Round ending:", data);
			// 	break;
			// case "tournament_end":
			// 	console.log("Tournament ending:", data);
			// 	break;
			case "ready_to_play":
				console.log(`Entering pool : ${data.game_id}`);
				route(`/game/${data.game_id}`);
				break;
			case "round_created":
				console.log("Round created:", data);
				route(`/tournament/${this.code}`);
				break;
			default:
				console.error("Unknown message type:", data.type);
				break;
		}
	};

	return TournamentSocket;

}


