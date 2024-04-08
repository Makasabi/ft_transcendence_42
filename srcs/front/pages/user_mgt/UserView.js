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

function addFriend(username, user_id) {
	console.log("Add friend request + notif");
	fetch("/api/user_management/add_friend/" + user_id, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	fetch("/api/notif/create_notif/friend_request/" + username, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	return "Remove Friend";
}

function removeFriend(username, user_id) {
	console.log("Remove friend request + notif");
	fetch("/api/user_management/remove_friend/" + user_id, {
		method: 'DELETE',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	fetch("/api/notif/create_notif/friend_removal/" + username, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	return "Add Friend";
}

function acceptRequest(username, user_id) {
	console.log("Accept friend request + notif");
	fetch("/api/user_management/add_friend/" + user_id, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	fetch("/api/notif/create_notif/accept_friend/" + username, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	return "Remove Friend";
}

async function addFriendButton(username)
{
	let button = document.getElementById("add-friend");
	let user2 = window.location.pathname.split('/')[2];

	let friend = await fetch("/api/user_management/user/" + user2, {
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json())

	fetch("/api/user_management/friends/" + friend.id, {
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json()).then(response => {
		if (response.friends === true)
			button.textContent = "Remove Friend";
		else if (response.friends === false)
			button.textContent = "Add Friend";
		else if (response.friends === "Request Pending")
			button.textContent = "Request Pending";
		else if (response.friends === "Invite Pending")
			button.textContent = "Accept Friend Request";
		console.log("response.friends: ", response.friends);
	});

	// Event listener to button to add or remove friend
	button.addEventListener("click", () => {
		if (button.textContent === "Add Friend")
			button.textContent = addFriend(friend.username, friend.id)
		else if (button.textContent === "Remove Friend")
			button.textContent = removeFriend(friend.username, friend.id)
		else if (button.textContent === "Accept Friend Request")
		button.textContent = acceptRequest(friend.username, friend.id)
	});
}
