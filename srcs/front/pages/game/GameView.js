import { GameContext, events } from "/front/pages/game/scripts/pong.js";
import { IView } from "/front/pages/IView.js";

export class GameView extends IView {
	static match_route(route) {
		return route === "/game";
	}

	static async render() {
		let ready_state = 0;
		let main = document.querySelector("main");
		let main_set = false;

		//let particule = document.getElementsByClassName("particles-js-canvas-el");
		//if (particule.length > 0)
		//	particule[0].remove();

		let footer = document.querySelector("footer");
		if (footer !== null)
			footer.remove();

		await fetch("/front/pages/game/game.html").then(response => response.text()).then(html => {
			main.innerHTML = html;
			main_set = true;

		});

		let stylesheet = document.createElement("link");
		stylesheet.rel = "stylesheet";
		stylesheet.href = "/front/pages/game/style.css";
		stylesheet.onload = () => {
			ready_state++;
		};
		document.head.appendChild(stylesheet);

		let script = document.createElement("script");
		script.src = "/front/pages/game/scripts/pong.js";
		script.type = "module";
		script.onload = () => {
			ready_state++;
		};

		while (!main_set)
			await new Promise(resolve => setTimeout(resolve, 100));
		main.appendChild(script);

		while (ready_state < 2)
			await new Promise(resolve => setTimeout(resolve, 100));

		try {
			let game = new GameContext();

			events(game);
			await game.load();
			game.run();
		}
		catch (e) {
			console.error("Game error", e);
		}
	}

	static destroy() {
	}
}
