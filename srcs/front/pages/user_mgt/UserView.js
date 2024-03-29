import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { MeView } from "/front/pages/user_mgt/MeView.js";
import { getProfileInfos, getHistoryStats } from "/front/pages/user_mgt/user_mgt.js";

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
