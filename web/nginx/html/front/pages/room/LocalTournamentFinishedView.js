import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import * as Login from "/front/pages/login/login.js";

export class LocalTournamentFinishedView extends IView {

	static match_route(route) {
		return route === "/LocalTournamentFinished" 
	}

	async render() {
		
		let newUrl = "/GoodGame/";
		let title = "Good Game";
		let state = { 'code': "winner" };
		window.history.pushState(state, title, newUrl);
		window.history.replaceState(state, title, newUrl);

		let html = await fetch("/front/pages/room/tournamentFinished.html").then(response => response.text());
		// let winner = localStorage.getItem('ranking').split("\"");
		let winner = JSON.parse(localStorage.getItem('ranking'));
		console.log("ranking : ", winner);

		html = html.replace("{{winner}}", winner[0]);

		let main = document.querySelector("main");
		if (main === null)
			return;
		main.innerHTML = html;

		let winner_avatar = await document.getElementById("winner");
		if (winner_avatar === null)
			return;
		let winner_img = document.createElement("img");
		winner_img.src = "/front/ressources/img/svg/icons/crown.svg";
		winner_img.style.borderRadius = "0%";
		winner_img.style.filter = "invert(80%) sepia(74%) saturate(1710%) hue-rotate(354deg) brightness(99%) contrast(94%)";
		winner_avatar.appendChild(winner_img);

		let backToHome = document.getElementById("backHomeTournamentFinished");
		if (backToHome === null)
			return;
		backToHome.addEventListener("click", (e) => {
			e.preventDefault();
			route("/home");
		});
	}
}