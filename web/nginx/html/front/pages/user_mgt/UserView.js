import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { getProfileInfos, getHistoryStats, displayGameBox } from "/front/pages/user_mgt/userMgtUtils.js";
import { route } from "/front/pages/spa_router.js";
import { APIcall } from "./userMgtUtils.js";

export class UserView extends IView {
	static match_route(route) {
		let regex = new RegExp("^/user/username/[\\w]+$");
		return regex.test(route);
	}

	async render() {
		// console.log("UserView.render");

		let requester = await APIcall("/api/user_management/me");
		if (window.location.pathname.split('/')[3] === requester.username) {
			route("/me");
			return;
		}

		let html = await fetch("/front/pages/user_mgt/user.html").then(response => response.text());
		let user = await APIcall("/api/user_management/user/username/" + window.location.pathname.split('/')[3]);
		if (user.error) {
			route("/me");
			return;
		}
		
		// profile-infos
		html = await getProfileInfos(html, user);
		// history-stats
		html = await getHistoryStats(html, user);
		
		let main = document.querySelector("main");
		if (main === null)
			return
		main.innerHTML = html;
		addFriendButton(requester.username);
		displayGameBox(user);
	}
}

function addFriend(username, user_id) {
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
	if (button === null)
		return;
	
	let user2 = window.location.pathname.split('/')[3];
	let friend = await APIcall("/api/user_management/user/username/" + user2);

	await APIcall("/api/user_management/friends/" + friend.id).then(response => {
		if (response.friends === true)
			button.textContent = "Remove Friend";
		else if (response.friends === false)
			button.textContent = "Add Friend";
		else if (response.friends === "Request Pending")
			button.textContent = "Request Pending";
		else if (response.friends === "Invite Pending")
			button.textContent = "Accept Friend Request";
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
