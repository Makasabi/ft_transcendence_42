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

// import * as Login from "/front/pages/login/login.js";
// import { IView } from "/front/pages/IView.js";
// import { route } from "/front/pages/spa_router.js";
// import { checkRoomCode } from "/front/pages/room/roomUtils.js";

// export class TournamentView extends IView {
// 	static match_route(route) {
// 		if (route.split("/")[1] === "tournament" && route.split("/")[2].length === 6 && route.split("/")[2] !== undefined) {
// 			return true;
// 		} else {
// 			return false;
// 		}
// 	}
	
// 	async render() {
		
// 		let code = document.URL.split("/")[4];
// 		let roomExists = await checkRoomCode(code);
// 		if (roomExists === false) {
// 			route("/unknown");
// 			return;
// 		}

// 		let html = await fetch("/front/pages/room/tournament.html").then(response => response.text());
// 		document.querySelector("main").innerHTML = html;
// 	}
// }