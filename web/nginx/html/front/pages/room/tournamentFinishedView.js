import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import * as Login from "/front/pages/login/login.js";

export class tournamentFinishedView extends IView {

	static match_route(route) {
		let test = new RegExp("^[0-9]*$");
		if (route.split("/")[1] === "tournamentFinished" && test.test(route.split("/")[2]) && route.split("/")[2] !== undefined) {
			return true;
		} else {
			return false;
		}
	}

	async render() {
		let user_id = document.URL.split("/")[4];
		let winner = await fetch(`/api/user_management/user/id/${user_id}`, {
			headers: {
				'Authorization': `Token ${Login.getCookie('token')}`,
			}
		}).then(response => response.json());
		console.log(winner);

		let newUrl = "/GoodGame/";
		let state = { 'code': winner.code };
		let title = "Good Game";
		window.history.pushState(state, title, newUrl);
		window.history.replaceState(state, title, newUrl);

		let html = await fetch("/front/pages/room/tournamentFinished.html").then(response => response.text());
		html = html.replace("{{winner}}", winner.username);
		document.querySelector("main").innerHTML = html;

		let winner_avatar = await document.getElementById("winner");
		let winner_img = document.createElement("img");
		let winner_link = document.createElement("a");
		winner_link.href = `/user/username/${winner.username}`;
		winner_img.src = winner.avatar_file;
		winner_link.appendChild(winner_img);
		winner_avatar.appendChild(winner_link);


		let backToHome = document.getElementById("backHomeTournamentFinished");
		backToHome.addEventListener("click", (e) => {
			e.preventDefault();
			route("/home");
		});
	}
}