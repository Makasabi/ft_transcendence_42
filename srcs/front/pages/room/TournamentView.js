/**
 * Min players in tournament : 8
 * Max players in tournament : 36
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
import { getRoomInfo, getTournmentInfo, getRoundInfo } from "/front/pages/room/tournamentUtils.js";

export class TournamentView extends IView {
	static match_route(route) {
		if (route.split("/")[1] === "tournament" && route.split("/")[2].length === 6 && route.split("/")[2] !== undefined) {
			return true;
		} else {
			return false;
		}
	}
	
	async render() {
		let code = document.URL.split("/")[4];
		let roomExists = await checkRoomCode(code);
		if (roomExists === false) {
			route("/unknown");
			return;
		}

		let roomInfo = await getRoomInfo(code)
		let tournament = await getTournmentInfo(roomInfo.room_id)
		let roundInfo = await getRoundInfo(tournament.id, tournament.current_round)

		let pools = roundInfo.distribution;
		console.log("pools : ", pools)
		console.log("pools len :", Object.keys(pools).length)

		let html = await fetch("/front/pages/room/tournament.html").then(response => response.text());
		document.querySelector("main").innerHTML = html;

		// compute the number of pool per round in another function
		let round_map = document.getElementById("round_map");
		console.log("round_map:", round_map);
		// create a div with class "rounds" inside the div id "round_map" for each round with the round number as id
		for (let i = 1; i <= tournament.total_rounds; i++) {
			let round = document.createElement("div");
			round.classList.add("round");
			round.id = `round${i}`;
			if (i === tournament.current_round) {
				round.classList.add("current_round");
				for (let j = 1; j <= Object.keys(pools).length; j++) {
					let pool = document.createElement("img");
					pool.src = "/front/ressources/img/svg/hexagon.svg";
					pool.id = `pool${j}`;
					round.appendChild(pool);
				}
			}
			round_map.appendChild(round);
		}


		// insert an img inside the div with the src set to /front/ressources/img/svg/hexagon.svg with id "pool" + number of the pool

		

	}
}