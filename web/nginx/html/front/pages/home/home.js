import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import { createRoomForm, joinRoomForm } from "../room/roomUtils.js";
import { NotifView, createNotificationSocket } from "../notif/NotifView.js";
import { createLocalGame } from "../game/local_game_utils.js";
import * as Login from "/front/pages/login/login.js";

export class LoggedHeaderView extends IView {
	async render() {
		let header_promise = fetch("/front/pages/home/header.html")
			.then(response => response.text())
			.then(html => document.querySelector("header").innerHTML = html);

		let user = await fetch("/api/user_management/me", {
			headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
		}).then(response => response.json())
		await header_promise;

		this.notifSocket = createNotificationSocket(user.username);
		new NotifView().render();
	}

	destroy() {
		if (this.notifSocket)
			this.notifSocket.close();
	}
}

export class HomeView extends IView {
	static match_route(route) {
		return route === "/home";
	}

	async render() {
		await fetch("/front/pages/home/home.html")
			.then(response => response.text())
			.then(html => document.querySelector("main").innerHTML = html);

		document.querySelector(".centered_box").addEventListener("click", async (e) => {
			switch (e.target.id)
			{
				case "game":
					route("/game");
					break;
				case "join":
					document.querySelector('.joinRoomForm').classList.toggle('show');
					document.getElementById("inputRoomCode").focus();
					// if (document.querySelector('.createRoomSelect').classList.contains('show'))
					// 	{ document.querySelector('.createRoomSelect').classList.remove('show'); }
					if (document.querySelector('.playLocalSelect').classList.contains('show'))
						{ document.querySelector('.playLocalSelect').classList.remove('show'); }
					break;
				case "create":
					route("/create/Normal");
					// document.querySelector('.createRoomSelect').classList.toggle('show');
					// if (document.querySelector('.joinRoomForm').classList.contains('show'))
					// 	{ document.querySelector('.joinRoomForm').classList.remove('show'); }
					// if (document.querySelector('.playLocalSelect').classList.contains('show'))
					// 	{ document.querySelector('.playLocalSelect').classList.remove('show'); }
					break;
				case "local":
					document.querySelector('.playLocalSelect').classList.toggle('show');
					if (document.querySelector('.joinRoomForm').classList.contains('show'))
						{ document.querySelector('.joinRoomForm').classList.remove('show'); }
					// if (document.querySelector('.createRoomSelect').classList.contains('show'))
					// 	{ document.querySelector('.createRoomSelect').classList.remove('show'); }
					break;
				case"me":
					route("/me");
					break;
			}
		});
		addLocalEvents();
		createRoomForm(); // from room.js
		joinRoomForm(); // from room.js
	}

	destroy() {
	}
}

async function addLocalEvents() {
	const button = document.getElementById("playLocalCTA");
	if (button === null) {
		return;
	}

	button.addEventListener("click", async (e) => {
		e.preventDefault();
		const radio_buttons = document.querySelectorAll(".playLocalMode input");
		let selected_mode;
		for (let index = 0; index < radio_buttons.length; index++) {
			if (radio_buttons[index].checked) {
				selected_mode = radio_buttons[index].value;
				break;
			}
		}
		if (selected_mode === undefined) {
			return;
		}
		if (selected_mode === "normal")
		{
			const game_id = await createLocalGame("localPlayer");
			if (game_id === undefined) {
				return;
			}
			route(`/game/${game_id}`);
		}
	});
}

export async function footer()
{
	return await fetch("/front/pages/home/footer.html").then(response => response.text());
}
