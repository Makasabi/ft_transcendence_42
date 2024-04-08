import * as Login from "/front/pages/login/login.js";
import { route } from "/front/pages/spa_router.js";

export async function	addPlayer(data) {

	let player = await fetch(`/api/user_management/user/id/${data.player_id}`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`,
		},
	}).then(response => response.json());

	let playerList = document.querySelector(".playersInTheRoom");
	let playerDiv = document.createElement("div");

	playerDiv.className = "player_box";
	playerDiv.id = `player${data.player_id}`;
	if (data.is_master === true) {
		playerDiv.innerHTML = `<img src="${player.avatar_file}" id="imgPlayer${data.player_id}" class="room_avatar" alt"${player.username} avatar">`
		+ `<div id="master">`
		+ `<img id="crown" src="/front/ressources/img/svg/icons/crown.svg" alt="Room Master">`
		+ `<p> ${player.username}</p>`
		+ `</div>`;
	}
	else {
		playerDiv.innerHTML = `<img src="${player.avatar_file}" id="imgPlayer${data.player_id}" class="room_avatar" alt"${player.username} avatar">` + `<p>${player.username}</p>`;
	}
	applyPlayerBorder(data.player_id);
	updateStartButton(data.player_id, data.is_master);
	playerList.appendChild(playerDiv);
}

export async function removePlayer(data) {
	let playerList = document.querySelector(".playersInTheRoom");
	let playerDiv = document.getElementById(`player${data.player_id}`);
	playerList.removeChild(playerDiv);
}

/**
 * Update the view when a player is updated
 * @param {*} data
 *
 */
export async function updatePlayer(data) {
	updateStartButton(data.player_id, data.is_master);

	let player = await fetch(`/api/user_management/user/id/${data.player_id}`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`,
		},
	}).then(response => response.json());

	let playerList = document.querySelector(".playersInTheRoom");
	let oldMaster = document.getElementById(`player${data.player_id}`);
	let newMaster = document.getElementById(`player${data.player_id}`);
	newMaster.id = `player${data.player_id}`;
	newMaster.innerHTML = `<img src="${player.avatar_file}" id="imgPlayer${data.player_id}" class="room_avatar" alt"${player.username} avatar">`
	+ `<div id="master">`
	+ `<img id="crown" src="/front/ressources/img/svg/icons/crown.svg" alt="Room Master">`
	+ `<p> ${player.username}</p>`
	+ `</div>`;
	playerList.replaceChild(newMaster, oldMaster);
}


export async function updateStartButton(player_id, is_master) {
	let me = await fetch(`/api/user_management/me`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`,
		},
	}).then(response => response.json());

	let Unabled = document.getElementById("unauthorosedToStart");
	let buttonAbled = document.querySelector(".cta");

	if (is_master === true) {
		if (player_id === me.id) {
			Unabled.style.display = "none";
			buttonAbled.style.display = "block";
		}
		else {
			Unabled.style.display = "block";
			buttonAbled.style.display = "none";
		}
	}
}

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
/*
TODO: When last player leaves room --> define what to do with room record.
*/

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
 * Collects response from the radio buttons and creates a room accordingly
 * @returns {void} routes to the selected room creation mode
 */
export function createRoomForm()
{
	let createRoom = document.querySelectorAll(".createRoomMode input");
	let selectedMode = "/create/normal";
	for (let index = 0; index < createRoom.length; index++) {
		createRoom[index].addEventListener("change", (event) => {
			event.preventDefault();
			if (event.target.value === "1") {
				selectedMode = "/create/normal";
			} else if (event.target.value === "2") {
				selectedMode = "/create/tournament";
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
 * Collects response from the input field and joins the room accordingly
 * @return {void} routes to the room page

 */
export function joinRoomForm()
{
	let input = document.getElementById("inputRoomCode");
	let joinRoomCTA = document.getElementById("joinRoomCTA");

	joinRoomCTA.addEventListener("click", (e) => {
		e.preventDefault();
		let code = input.value;
		let newUrl = "/room/" + code;
		let state = { 'code': code };
		let title = "Room " + code;
		window.history.pushState(state, title, newUrl);
		window.history.replaceState(state, title, newUrl);
		route(newUrl);
	});
}