import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";

export class FriendsView extends IView {
	static match_route(route) {
		let regex = new RegExp("/friends");
		return regex.test(route);
	}

	async render() {
		console.log("FriendsView.render");
		const friends = await fetch("/api/user_management/get_friends", {
			headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
		}).then(response => response.json());
		
		let html = await fetch("/front/pages/user_mgt/friends.html").then(response => response.text());
		document.querySelector("main").innerHTML = html;

		// console.log(friends);
		const friendsContainer = document.querySelector(".current-friends");
		friends.forEach(friend => {
			const friendContainer = document.createElement("div");
			friendContainer.classList.add("friend-container");
			
			const avatar = document.createElement("img");
			avatar.src = friend.avatar_file;
			avatar.alt = friend.username;
			avatar.classList.add("friend-avatar");
			
			let friend_profile = "/user/username/" + friend.username;
			avatar.addEventListener("click", (e) => {
				e.preventDefault();
				route(friend_profile);
			});
			friendContainer.appendChild(avatar);

			const username = document.createElement("p");
			username.textContent = friend.username;
			username.classList.add("friend-username");

			friendContainer.appendChild(username);

			friendsContainer.appendChild(friendContainer);
		});
	}

}