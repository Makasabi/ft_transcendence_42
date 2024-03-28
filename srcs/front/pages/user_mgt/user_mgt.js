import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";

export class MeView extends IView {
	static match_route(route) {
		return route === "/me";
	}

	static async render() {
		let html = await fetch("/front/pages/user_mgt/me.html").then(response => response.text());
		let user = await fetch("/api/user_management/me", {
			headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
		}).then(response => response.json());
		// console.log("user", user);

		// profile-infos
		html = html.replace("{{avatar}}", user.avatar_file);
		// console.log(user.avatar_file);
		html = html.replace("{{username}}", user.username);
		html = html.replace("{{email}}", user.email);

		// global rank
		// getGlobalRank(html, user);

		html = html.replace("{{rank}}", user.global_rank);

		// history-stats
		html = getHistoryStats(html, user);

		// console.log(user.avatar_file);

		document.querySelector("main").innerHTML = html;

		editProfileButton();
	}
}

export function getHistoryStats(html, user)
{
	let historyTable = '';
	for (let game of user.game_history) {
		historyTable += `
		<tr>
		<td>${game.rank}</td>
		<td>${game.mode}</td>
		<td>${game.visibility}</td>
		<td>${game.date_played}</td>
		</tr>
		`;
	}
	html = html.replace("{{history}}", historyTable);
	html = html.replace("{{games_played}}", user.game_history.length);
	html = html.replace("{{games_won}}", user.game_history.filter(game => game.rank.split('/')[0] === '1').length);
	html = html.replace("{{tournament_played}}", user.game_history.filter(game => game.mode === 'Tournament').length);
	html = html.replace("{{tournament_wins}}",
		user.game_history.filter(game => game.rank.split('/')[0] === '1' && game.mode === 'Tournament').length);
	return html;
}

function editModeOn(editables) {

	for (let editable of editables) {
		editable.contentEditable = true;
		editable.style.padding = "5px";
		editable.style.backgroundColor = "#dedede";
		editable.style.color = "#353536";
		editable.style.borderRadius = "5px";
	}
	document.getElementById("edit-button").textContent = "Save"; 
	return true;
}

async function editProfile() {

	let username = document.getElementById("username").textContent;
	let email = document.getElementById("email").textContent;
	
	const response = await fetch('api/user_management/edit_profile', {
		method: 'POST',
		headers: {
			'Content-type' : 'application/json', 
			'Authorization': `Token ${Login.getCookie('token')}`
		},
		body: JSON.stringify({ 'username' : username, 'email' : email }),
	
	}).then(response => response.json());
	// console.log(response);

}	

function editModeOff(editables) {

	for (let editable of editables) {
		editable.contentEditable = false;
		editable.style.removeProperty("style");
		editable.style.removeProperty("background-color");
		editable.style.removeProperty("border");
		editable.style.color = "#dedede";
	}
	document.getElementById("edit-button").textContent = "Edit my Profile"; 
	return false;
}

function editProfileButton()
{
	// change button text from "Edit my profile" to "Save"
	document.getElementById("edit-button").textContent = "Edit my Profile"; 
	const editables = document.getElementsByClassName("edit");
	let edit = false;
	document.getElementById("edit-button").addEventListener("click", () => {
		if (edit === true)
		{
			editProfile();
			edit = editModeOff(editables);
		}
		else
			edit = editModeOn(editables);
	});
}