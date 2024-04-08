import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { MeView } from "/front/pages/user_mgt/MeView.js";
import { getProfileInfos, getHistoryStats } from "/front/pages/user_mgt/user_mgt.js";
import { route } from "/front/pages/spa_router.js";

export class UserView extends IView {
	static match_route(route) {
		let regex = new RegExp("^/user/[\\w]+$");
		return regex.test(route);
	}

	async render() {
		console.log("UserView.render");
		let call = "/api/user_management/user/" + window.location.pathname.split('/')[2];

		//  retrieve current requester
		let requester = await fetch("/api/user_management/me", {
			headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
		}).then(response => response.json());
		
		let html = await fetch("/front/pages/user_mgt/user.html").then(response => response.text());
		let user = await fetch(call, {
			headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
		}).then(response => response.json());
		if (user.error)
		{
			route("/me");
			return;
		}
		
		// profile-infos
		html = getProfileInfos(html, user);
		// history-stats
		html = getHistoryStats(html, user);
		
		document.querySelector("main").innerHTML = html;
		addFriendButton(requester.username);
	}
}

function addFriend(username, user2) {
	console.log("Add friend request + notif");
	fetch("/api/user_management/add_friend/" + user2, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	fetch("/api/notif/create_notif/friend_request/" + user2, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	return "Remove Friend";
}

function removeFriend(username, user2) {
	console.log("Remove friend request + notif");
	fetch("/api/user_management/remove_friend/" + user2, {
		method: 'DELETE',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	fetch("/api/notif/create_notif/friend_removal/" + user2, {
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
