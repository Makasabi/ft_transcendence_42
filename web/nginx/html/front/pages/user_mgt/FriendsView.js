import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import { APIcall } from "./userMgtUtils.js";

export class FriendsView extends IView {
	static match_route(route) {
		let regex = new RegExp("/friends");
		return regex.test(route);
	}

	async render() {
		console.log("FriendsView.render");

		let friends = await APIcall("/api/user_management/get_friends");
		let html = await fetch("/front/pages/user_mgt/friends.html").then(response => response.text());
		document.querySelector("main").innerHTML = html;
	
		const friendsContainer = document.querySelector(".current-friends");
		friends.forEach(async friend =>{
			const friendContainer = document.createElement("div");
			friendContainer.classList.add("friend-container");

			const avatar = document.createElement("img");
			avatar.src = friend.avatar_file;
			avatar.alt = friend.username;

			await APIcall(`/api/user_management/get_online_status/${friend.username}`).then(data => {
				console.log(data);
				if (data.is_online === true) {
					avatar.style.border = "var(--online-green) 4px solid";
				}
			});
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

		// Autocomplete functionality
		const searchInput = document.getElementById("search-friends");
		let resultsContainer = document.getElementById("friends_results");
		resultsContainer.style.display = 'none';
		resultsContainer.innerHTML = '';

		let inputValue = '';
		searchInput.addEventListener("keyup", async (e) => {
			e.preventDefault();
			const test = new RegExp(/\w+/g);
			inputValue = searchInput.value.trim();
			if (!test.test(inputValue)) {
				resultsContainer.innerHTML = '';
				resultsContainer.style.display = 'none';
			} else {
				let suggestions = await APIcall('/api/user_management/user/search/' + inputValue);
				if (suggestions.length === 0) {
					resultsContainer.innerHTML = '<ul><li>No Results</li></ul>';
				} else {
					console.log("Suggestions" + suggestions);
					let list = '';
					if (suggestions.length > 5) {
						suggestions = suggestions.slice(0, 5);
					}
					for (let i = 0; i < suggestions.length; i++) {
						list += `<a onclick="route('/user/username/${suggestions[i].username}')"><li>${suggestions[i].username}</li></a>`;
					}
					resultsContainer.innerHTML = '<ul>' + list + '</ul>';
					resultsContainer.style.display = 'block';
					// console.log(resultsContainer);
				}
			}
		});
	}
}
