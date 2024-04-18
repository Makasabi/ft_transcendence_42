import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";

export class UninvitedView extends IView {

	static match_route(route) {
		return route === "/uninvited" 
	}

	async render() {
		let html = await fetch("/front/pages/room/uninvited.html").then(response => response.text());
		document.querySelector("main").innerHTML = html;

		let backToHome = document.getElementById("backHomeUninvited");
		if (backToHome === null)
			return
		backToHome.addEventListener("click", (e) => {
			e.preventDefault();
			route("/home");
		});
	}
}