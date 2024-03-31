import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import { createRoomMode, joinRoomForm } from "/front/pages/room/room.js";

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

		document.querySelector(".centered_box").addEventListener("click", (e) => {
			switch (e.target.id)
			{
				case "game":
					route("/game");
					break;
				case "join":
					document.querySelector('.joinRoomForm').classList.toggle('show');
					if (document.querySelector('.createRoomSelect').classList.contains('show'))
						{ document.querySelector('.createRoomSelect').classList.remove('show'); }
					break;
				case "create":
					document.querySelector('.createRoomSelect').classList.toggle('show');
					if (document.querySelector('.joinRoomForm').classList.contains('show'))
						{ document.querySelector('.joinRoomForm').classList.remove('show'); }
					break;
				case "me":
					route("/me");
					break;
			}
		});
		createRoomMode(); // from room.js
		joinRoomForm(); // from room.js
	}

	static destroy() {
	}
}

export async function footer()
{
	return await fetch("/front/pages/home/footer.html").then(response => response.text());
}