import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";

export class LoggedHeaderView extends IView {
	static async render() {
		fetch("/front/pages/home/header.html")
			.then(response => response.text())
			.then(html => document.querySelector("header").innerHTML = html);
	}
}

export class HomeView extends IView {
	static match_route(route) {
		return route === "/home";
	}

	static async render() {
		await fetch("/front/pages/home/home.html")
			.then(response => response.text())
			.then(html => document.querySelector("main").innerHTML = html);

		document.getElementById("game").addEventListener("click", () => {
			route("/game");
		});
	}

	static destroy() {
	}
}

export async function footer()
{
	return await fetch("/front/pages/home/footer.html").then(response => response.text());
}
