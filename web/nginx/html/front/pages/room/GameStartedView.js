import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";

export class GameStartedView extends IView {
	static match_route(route) {
		return route === "/gamestarted" 
	}

	async render() {
		let html = await fetch("/front/pages/room/gamestarted.html").then(response => response.text());
		let main = document.querySelector("main");
		if (main === null)
			return
		main.innerHTML = html;

		let backToHome = document.getElementById("backHomeFullRoom");
		if (backToHome === null)
			return
		backToHome.addEventListener("click", (e) => {
			e.preventDefault();
			route("/home");
		});
	}
}