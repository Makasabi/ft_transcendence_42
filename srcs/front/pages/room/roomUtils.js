import * as Login from "/front/pages/login/login.js";
import { route } from "/front/pages/spa_router.js";

/*
TODO: When last player leaves room --> define what to do with room record.
*/

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

	let me = await fetch(`/api/user_management/me_id`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`,
		},
	}).then(response => response.json());

	if (player_id === me.id) {
		let playerImgDiv = document.getElementById(`imgPlayer${player_id}`);
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
		if (guest === "" || guest === null || guest === "Friends") {
			return;
		}
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

export function copyLink(){
// when clicking on room code, copies it to the clipboard and adds a confirmation message in a bubble
	const copyButton = document.getElementById("copy_room_code");
	copyButton.addEventListener("click", async () => {
		const roomCode = document.getElementById("this_code");
		const code = roomCode.textContent;
		const clipboard = navigator.clipboard;
		if (!clipboard) {
			return;
		}
		await clipboard.writeText(code);
		const text = document.getElementById("this_code");
		const bubble = document.getElementById("bubble");
		text.hidden = true;
		bubble.hidden = false;
		setTimeout(() => {
			text.hidden = false;
			bubble.hidden = true;
		}, 1000);
	}
	);
}


/*
TODO: When last player leaves room --> define what to do with room record.
TODO: add Leave Room button
TODO: Limit number of players in tournament at MIN 8 & MAX 36
*/


export function errorMessage(message) {
	const insert = document.getElementById("readyToPlay");
	// create a div and put the error message in it and alight it to the center
	// do no redisplay the error message if it already exists
	if (document.getElementById("errorDiv") !== null) {
		return;
	}
	const errorDiv = document.createElement("div");
	errorDiv.id = "errorDiv";
	errorDiv.innerHTML = message;
	errorDiv.style.color = "red";
	errorDiv.style.textAlign = "center";
	insert.appendChild(errorDiv);

}

