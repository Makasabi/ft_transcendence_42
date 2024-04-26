import { GameContext } from "/front/pages/game/scripts/pong.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js"
import { getCookie } from "../login/login.js";
import { getCurrentRoundAndGame } from "/front/pages/room/WaitingRoom.js";

export class GameView extends IView {
	static match_route(route) {
		const regex = new RegExp("^/game/[0-9]+$");
		return regex.test(route);
	}

	async render() {
		let ready_state = 0;
		let main = document.querySelector("main");
		if (main === null)
			return;
		let main_set = false;

		const footer = document.getElementById("footer");
		if (footer !== null)
			footer.hidden = true;
		const game_footer = document.createElement("footer");
		game_footer.id = "game_footer";
		main.insertAdjacentElement("afterend", game_footer);

		await fetch("/front/pages/game/game.html").then(response => response.text()).then(html => {
			main.innerHTML = html;
			main_set = true;
		});

		this.stylesheet = document.createElement("link");
		this.stylesheet.rel = "stylesheet";
		this.stylesheet.href = "/front/pages/game/style.css";
		this.stylesheet.onload = () => {
			ready_state++;
		};
		document.head.appendChild(this.stylesheet);

		//let script = document.createElement("script");
		//script.src = "/front/pages/game/scripts/pong.js";
		//script.type = "module";
		//script.onload = () => {
		//	ready_state++;
		//};

		while (!main_set)
			await new Promise(resolve => setTimeout(resolve, 100));
		//main.appendChild(script);

		while (ready_state < 1)
			await new Promise(resolve => setTimeout(resolve, 100));

		try {
			const game_id = document.URL.split("/")[4];
			this.game = new GameContext(game_id);
			let redirect_route = fetch("/api/game/get_redirect/" + game_id
				, {
					method: "GET",
					headers: {
						"Authorization": `Token ${getCookie("token")}`,
					}}
				).then((response) => {
					if (!response.ok)
						throw new Error("HTTP error " + response.status);
					return response.json();
				})
				.then(data => data.redirect_route)
				.catch(e => {
					console.error("Error getting redirect route", e);
					return "/";
				});

			console.log("Start game");
			await this.game.start();
			console.log("End of game");
			console.log("Ranking : ", this.game.ranking);
			console.log("Score : ", this.game.score);

			if (this.game.ranking !== null)
				this.display_ranking();
			else
				this.display_bad_end();

			await new Promise(resolve => setTimeout(resolve, 3000));
			
			if (window.location.pathname !== "/game/" + game_id)
				return;
			if (this.update_schedule())
				return;
			const redirect = await redirect_route;
			route(redirect);
		}
		catch (e) {
			console.log("Game error");
			// console.error("Game error", e);
			route("/");
		}
	}

	destroy() {
		if (this.game !== undefined)
			this.game.destroy();
		document.head.removeChild(this.stylesheet);
		const footer = document.getElementById("footer");
		if (footer !== null)
			footer.hidden = false;
		const game_footer = document.getElementById("game_footer");
		if (game_footer !== null)
			game_footer.remove();
		const main = document.querySelector("main");
		if (main === null)
			return;
	}

	stop() {
		if (this.game !== undefined)
			this.game.stop();
	}

	reset_centered_box() {
		const box = document.getElementById("centered_box");
		const timer = document.getElementById("timer");
		const status = document.getElementById("game_status");
		const status_title = document.querySelector("#game_status h2");
		const player_list = document.getElementById("players");

		if (box === null || timer === null || status === null || status_title === null || player_list === null)
			return;

		box.style.display = "none";
		timer.hidden = true;
		status.style.display = "none";
		status_title.innerHTML = "";
		player_list.innerHTML = "";
	}

	display_ranking() {
		this.reset_centered_box()

		const box = document.getElementById("centered_box");
		const status = document.getElementById("game_status");
		const status_title = document.querySelector("#game_status h2");

		if (box === null || status === null || status_title === null)
			return;

		box.style.display = "flex";
		status.style.display = "flex";

		const ranking = this.game.ranking;
		//const players = this.game.state.everyone;
		//const sorted = [...players].sort((a, b) => ranking.indexOf(a) - ranking.indexOf(b));
		//console.log("Sorted", sorted);
		if (this.game.state === undefined || this.game.state.player_id === undefined)
			return;
		if (this.game.state.is_local) {
			status_title.innerHTML = ranking[0] + " won!";
		}
		else {
			if (this.game.state.player_id === ranking[ranking.length - 1])
				status_title.innerHTML = "You won!";
			else
				status_title.innerHTML = "You lost!";
		}
	}

	display_bad_end() {
		this.reset_centered_box()

		const box = document.getElementById("centered_box");
		const status = document.getElementById("game_status");
		const status_title = document.querySelector("#game_status h2");
		if (box === null || status === null || status_title === null)
			return;

		box.style.display = "flex";
		status.style.display = "flex";
		status_title.innerHTML = "Game ended unexpectedly";
	}

	update_schedule() {
		console.log("Update tour");
		const schedule = JSON.parse(localStorage.getItem("schedule"));
		if (schedule === null)
			return false;
		const state = getCurrentRoundAndGame(schedule);
		if (state === null)
			return false;
		const match = state.currentGame;
		match.winner = this.game.ranking[0];
		match.score = this.game.score;
		console.log("Score : ", match.score);
		localStorage.setItem('schedule', JSON.stringify(schedule));
		route("/waiting_room");
		return true;
	}
}
