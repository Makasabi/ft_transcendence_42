import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";

export class UnknownRoomView extends IView {

	static match_route(route) {
		return route === "/unknown" 
	}

	async render() {
		let html = await fetch("/front/pages/room/unknown.html").then(response => response.text());
		let main = document.querySelector("main");
		if (main === null)
			return
		main.innerHTML = html;

		let backToHome = document.getElementById("backHomeUnknownRoom");
		if (backToHome === null)
			return
		backToHome.addEventListener("click", (e) => {
			e.preventDefault();
			route("/home");
		});
	}
}