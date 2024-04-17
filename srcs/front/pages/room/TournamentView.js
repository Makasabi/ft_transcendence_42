/**
 *
 * TODO:
 * Implement end of tournament
 * Implement - touirnament access
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
		if (this.roomInfo === undefined) {
			console.error("Room not found")
			route("/unknown");
			return;
		}

		// check if user can access the tournament

		let tournament_info = await getTournamentInfo(this.roomInfo.room_id)
		if (tournament_info === undefined) {
			console.error("Tournament not found")
			route("/unknown");
			return;
		}
		const access = tournament_info.access;
		const status = tournament_info.Tournament_Finished;
		const winner = tournament_info.winner;

		if (status === "finished" && winner !== null){
			route(`/tournamentFinished/${winner}`)
			return;
		}
		switch (access) {
			case "Loosed":
				route("/playerEliminated");
				return;
			case "Uninvited":
				route("/uninvited");
				return;
			case false:
				route("/unknown");
				return;
			}

		this.tournament = tournament_info.tournament;
		this.TournamentSocket = createTournamentSocket(this.tournament.id);

		let roundInfo = await getRoundInfo(this.tournament.id, this.tournament.current_round)
		let first_round = await getRoundInfo(this.tournament.id, 1)
		let first_pools = await renamePools(first_round.distribution);

		let html = await fetch("/front/pages/room/tournament.html").then(response => response.text());
		document.querySelector("main").innerHTML = html;

		let pools = await renamePools(roundInfo.distribution);
		fillRoundMap(this.tournament, first_pools);
		displayMyPool(pools, this.tournament.current_round);
		displayAPool(pools);

		this.ping();
		this.updateNextRoundTimer();
		this.start_time = await getRoundStartTime(this.tournament.id, this.tournament.current_round);
		if (!this.start_time) {
			const next_round_timer = document.getElementById("next_round_timer");
			if (next_round_timer === null)
				return;
			next_round_timer.innerText = "No upcoming round";
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

		if (timeRemaining <= 0 && this.TournamentSocket.readyState === WebSocket.OPEN) {
			const to_send = JSON.stringify({
				"type" : "ready_to_play",
				"message" : "ready to play",
			})
			this.TournamentSocket.send(to_send)
			const next_round_timer = document.getElementById("next_round_timer");
			if (next_round_timer === null)
				return;
			next_round_timer.innerText = "Round has started";
			return;
		}

		let minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
		let seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

		let formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		const next_round_timer = document.getElementById("next_round_timer");
		if (next_round_timer === null)
			return;
		next_round_timer.innerText = `Next round starting in ${formattedTime}`;
		setTimeout(this.updateNextRoundTimer.bind(this), 100);
	}

	async ping() {
		console.log("Pinging tournament socket");
		if (this.TournamentSocket.readyState === WebSocket.CLOSED
			|| this.TournamentSocket.readyState === WebSocket.CLOSING)
			return;
		while (this.TournamentSocket.readyState === WebSocket.CONNECTING) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
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
			case "ready_to_play":
				console.log(`Entering pool : ${data.game_id}`);
				route(`/game/${data.game_id}`);
				break;
			case "round_created":
				console.log("Round created:", data);
				route(`/tournament/${data.tournament_code}`);
				break;
			case "tournament_finished":
				console.log("tournament_finished:", data);
				route(`/tournamentFinished/${data.winner}`)
				break;
			default:
				console.error("Unknown message type:", data.type);
				break;
		}
	};
	return TournamentSocket;
}


