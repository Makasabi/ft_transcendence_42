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
		addFriendButton(user.username);
	}
}

function addFriend(username, user2) {
	// console.log("Add friend request + notif");
	fetch("/api/user_management/add_friend/" + user2, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	fetch("/api/notif/notif_add_friend/" + username, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	return "Remove Friend";
}

function removeFriend(username, user2) {
	// console.log("Remove friend request + notif");
	fetch("/api/user_management/remove_friend/" + user2, {
		method: 'DELETE',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	fetch("/api/notif/notif_remove_friend/" + username, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	return "Add Friend";
}

function addFriendButton(username)
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
			button.textContent = addFriend(username, user2)
		else
			button.textContent = removeFriend(username, user2)
	});
}
