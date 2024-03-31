import { IView } from "/front/pages/IView.js";

export class createNormalRoomView extends IView {
	static match_route(route) {
		return route === "/create/normal";
	}

	static async render() {
		
		let html = await fetch("/front/pages/room/create.html").then(response => response.text());
		document.querySelector("main").innerHTML = html;
	}
}

export class createTournamentRoomView extends IView {
	static match_route(route) {
		return route === "/create/tournament";
	}

	static async render() {
		let html = await fetch("/front/pages/room/create.html").then(response => response.text());
		document.querySelector("main").innerHTML = html;
	}
}