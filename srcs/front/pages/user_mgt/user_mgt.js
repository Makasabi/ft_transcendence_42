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
	
		// profile-infos
		html = getProfileInfos(html, user);
		// history-stats
		html = getHistoryStats(html, user);

		document.querySelector("main").innerHTML = html;
		editProfileButton();
	}
}

function getProfileInfos(html, user) {
	html = html.replace("{{avatar}}", user.avatar_file);
	html = html.replace("{{username}}", user.username);
	html = html.replace("{{email}}", user.email);
	html = html.replace("{{rank}}", user.global_rank);
	return html;
}


function getHistoryStats(html, user)
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

export class UserView extends IView {
	static match_route(route) {
		let regex = new RegExp("^/user/[\\w]+$");
		return regex.test(route);
	}

	static async render() {
		console.log("UserView.render");
		let call = "/api/user_management/user/" + window.location.pathname.split('/')[2];

		let html = await fetch("/front/pages/user_mgt/user.html").then(response => response.text());
		let user = await fetch(call, {
			headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
			
		}).then(response => response.json());
		if (user.error)
		{
			MeView.render();
			return;
		}

		// profile-infos
		html = getProfileInfos(html, user);
		// history-stats
		html = getHistoryStats(html, user);

		document.querySelector("main").innerHTML = html;
		addFriendButton();
	}
}

function addFriend(user) {
	fetch("/api/user_management/add_friend/" + user, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	return "Remove Friend";
}

function removeFriend(user) {
	fetch("/api/user_management/remove_friend/" + user, {
		method: 'DELETE',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	return "Add Friend";
}

function addFriendButton()
{
	let button = document.getElementById("add-friend");
	let user2 = window.location.pathname.split('/')[2];

	fetch("/api/user_management/friends/" + user2, {
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json()).then(response => {
		if (response.friends === true)
			button.textContent = "Remove Friend";
		else
			button.textContent = "Add Friend";
	});

	// Event listener to button to add or remove friend
	button.addEventListener("click", () => {
		if (button.textContent === "Add Friend")
			button.textContent = addFriend(user2)
		else
			button.textContent = removeFriend(user2)
	});


}