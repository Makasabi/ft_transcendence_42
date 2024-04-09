import * as Login from "/front/pages/login/login.js";
import { route } from "/front/pages/spa_router.js";

/**
 * Collects response from the radio buttons and creates a room accordingly
 * @returns {void} routes to the selected room creation mode
*/
export function createRoomForm()
{
	let createRoom = document.querySelectorAll(".createRoomMode input");
	let selectedMode = "/create/Normal";
	for (let index = 0; index < createRoom.length; index++) {
		createRoom[index].addEventListener("change", (event) => {
			event.preventDefault();
			if (event.target.value === "1") {
				selectedMode = "/create/Normal";
			} else if (event.target.value === "2") {
				selectedMode = "/create/Tournament";
			}
		});
	}
	let createRoomCTA = document.getElementById("createRoomCTA");
	createRoomCTA.addEventListener("click", (e) => {
		e.preventDefault();
		route(selectedMode);
	});
}

/**
 * Verifies if the room code is valid or not
 * @param {string} code
 * @returns {Response} {status: 200, message: "Room exists"} or {status: 404, message: "Room does not exist"}
 */
export async function checkRoomCode(code) {
	const response = await fetch(`/api/rooms/code/${code}`, {
		method: 'GET',
		headers: {
			'Authorization': `Token ${Login.getCookie('token')}`
		}
	}).then(response => response.json());
	if (response.status === false) {
		return false;
	}
	return true;	
}

/**
 * Collects response from the input field and joins the room accordingly
 * @return {void} routes to the room page

 */
export function joinRoomForm()
{
	let input = document.getElementById("inputRoomCode");
	let joinRoomCTA = document.getElementById("joinRoomCTA");

	joinRoomCTA.addEventListener("click", (e) => {
		e.preventDefault();
		const test = new RegExp(/^\w{6,6}$/gm);
		if (!test.test(input.value)) {
			route("/unknown");
			return;
		}
		let code = input.value;
		let newUrl = "/room/" + code;
		let state = { 'code': code };
		let title = "Room " + code;
		window.history.pushState(state, title, newUrl);
		window.history.replaceState(state, title, newUrl);
		route(newUrl);
	});
}

/**
 * Adds a border to the player avatar if it is the current user
 * @param {*} player_id 
 */
export async function applyPlayerBorder(player_id) {

	let me = await fetch(`/api/user_management/me`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`,
		},
	}).then(response => response.json());

	if (player_id === me.id) {
		console.log(`player${player_id} and me.id ${me.id} are the same`);
		let playerImgDiv = document.getElementById(`imgPlayer${player_id}`);
		console.log(playerImgDiv);
		playerImgDiv.style.border = "var(--primary-color) 4px solid";
	}

}

/**
 * Loads the list of user friends in the dropdown
 */
export async function addFriendList() {
	const friends = await fetch("/api/user_management/get_friends", {
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json());

	let inviteFriends = document.getElementById("invite_friends");

	const defaultOption = document.createElement("option");
	defaultOption.value = "";
	defaultOption.disabled = true;
	defaultOption.selected = true;
	defaultOption.hidden = true;
	defaultOption.textContent = "Friends";
	inviteFriends.appendChild(defaultOption);

	friends.forEach(friend => {
		const friendContainer = document.createElement("option");
		friendContainer.value = friend.username;
		friendContainer.textContent = friend.username;
		inviteFriends.appendChild(friendContainer);
	});
}

/**
 * Sends a notification to the selected friend
 * @param {*} code 
 * @param {*} mode 
 */

export async function inviteFriend(code, mode) {
	const inviteFriends = document.getElementById("invite_friends");
	let inviteButton = document.getElementById("invite_button");
	inviteButton.addEventListener("click", async (e) => {
		// retrive value selected in the dropdown
		const guest = inviteFriends.value; 
		console.log("Inviting friends: ", guest, "to Room: ", code, " mode: ", mode)
		// send invite to the room
		fetch("/api/notif/create_notif/game_invitation/" + guest, {
			method: 'POST',
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': `Token ${Login.getCookie('token')}`
			}, 
			body: JSON.stringify({
				"room_code": code,
				"room_mode": mode,
			}),
		});
	});
}

/*
TODO: When last player leaves room --> define what to do with room record.
*/




