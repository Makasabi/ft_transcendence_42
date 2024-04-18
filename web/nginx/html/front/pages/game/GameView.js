import { GameContext } from "/front/pages/game/scripts/pong.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js"
import { getCookie } from "../login/login.js";

export class GameView extends IView {
	static match_route(route) {
		const regex = new RegExp("^/game/[0-9]+$");
		return regex.test(route);
	}

	async render() {
		let ready_state = 0;
		let main = document.querySelector("main");
		let main_set = false;

		//let particule = document.getElementsByClassName("particles-js-canvas-el");
		//if (particule.length > 0)
		//	particule[0].remove();

		this.footer = document.querySelector("footer");
		if (this.footer !== null)
			this.footer.remove();

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

			if (this.game.ranking !== null)
				this.display_ranking();
			else
				this.display_bad_end();

			await new Promise(resolve => setTimeout(resolve, 3000));

			if (window.location.pathname !== "/game/" + game_id)
				return;
			const redirect = await redirect_route;
			console.log("Redirect to", redirect);
			route(redirect);
		}
		catch (e) {
			console.error("Game error", e);
			route("/");
		}
	}

	destroy() {
		this.game.destroy();
		document.head.removeChild(this.stylesheet);
		const main = document.querySelector("main");
		main.insertAdjacentHTML("afterend", this.footer.outerHTML);
	}

	stop() {
		this.game.stop();
	}

	reset_centered_box() {
		const box = document.getElementById("centered_box");
		const timer = document.getElementById("timer");
		const status = document.getElementById("game_status");
		const status_title = document.querySelector("#game_status h2");
		const player_list = document.getElementById("players");

		if (box === null)
			return;
		if (timer === null)
			return;
		if (status === null)
			return;
		if (status_title === null)
			return;
		if (player_list === null)
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
		if (box === null)
			return;
		const status = document.getElementById("game_status");
		if (status === null)
			return;
		const status_title = document.querySelector("#game_status h2");
		if (status_title === null)
			return;

		box.style.display = "flex";
		status.style.display = "flex";

		const ranking = this.game.ranking;
		//const players = this.game.state.everyone;
		//const sorted = [...players].sort((a, b) => ranking.indexOf(a) - ranking.indexOf(b));
		//console.log("Sorted", sorted);
		if (this.game.state.player_id === ranking[ranking.length - 1])
			status_title.innerHTML = "You won!";
		else
			status_title.innerHTML = "You lost!";
	}

	display_bad_end() {
		this.reset_centered_box()

		const box = document.getElementById("centered_box");
		if (box === null)
			return;
		const status = document.getElementById("game_status");
		if (status === null)
			return;
		const status_title = document.querySelector("#game_status h2");
		if (status_title === null)
			return;

		box.style.display = "flex";
		status.style.display = "flex";
		status_title.innerHTML = "Game ended unexpectedly";
	}
}
