import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";

export class EliminatedView extends IView {

	static match_route(route) {
		return route === "/playerEliminated" 
	}

	async render() {
		let html = await fetch("/front/pages/room/eliminated.html").then(response => response.text());
		document.querySelector("main").innerHTML = html;

		let backToHome = document.getElementById("backHomeEliminated");
		backToHome.addEventListener("click", (e) => {
			e.preventDefault();
			route("/home");
		});
	}
}