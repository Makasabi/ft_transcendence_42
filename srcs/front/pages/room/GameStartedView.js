import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";

export class GameStartedView extends IView {
	static match_route(route) {
		return route === "/gamestarted" 
	}

	async render() {
		let html = await fetch("/front/pages/room/gamestarted.html").then(response => response.text());
		document.querySelector("main").innerHTML = html;

		let backToHome = document.getElementById("backHomeFullRoom");
		backToHome.addEventListener("click", (e) => {
			e.preventDefault();
			route("/home");
		});
	}
}