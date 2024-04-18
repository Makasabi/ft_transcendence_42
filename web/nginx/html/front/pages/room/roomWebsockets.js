import * as Login from "/front/pages/login/login.js";
import { route } from "/front/pages/spa_router.js";
import { applyPlayerBorder} from "/front/pages/room/roomUtils.js";

/**
 * Add a player to the view when player joins the room
 * @param {*} data
 */
export async function	addPlayer(data) {

	let player = await fetch(`/api/user_management/user/id/${data.player_id}`, {
		method: "GET",
		headers: {
			'Authorization': `Token ${Login.getCookie('token')}`,
		},
	}).then(response => response.json());

	let checkkPlayer = document.getElementById(`player${data.player_id}`);
	if (checkkPlayer) {
		return;
	}

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

/**
 * Remove a player from the view when player leaves the room
 * @param {*} data
 */
export async function removePlayer(data) {
	let playerList = document.querySelector(".playersInTheRoom");
	let playerDiv = document.getElementById(`player${data.player_id}`);
	playerList.removeChild(playerDiv);
}

/**
 * Update the view when a player is updated (new master)
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
	applyPlayerBorder(data.player_id);

}

/**
 * Update the start button view when the master changes
 * @param {*} player_id
 * @param {*} is_master
 */
export async function updateStartButton(player_id, is_master) {
	let me = await fetch(`/api/user_management/me_id`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`,
		},
	}).then(response => response.json());

	let Unabled = document.getElementById("unauthorosedToStart");
	let buttonAbled = document.getElementById("start");

	if (is_master === true) {
		if (player_id != me.id) {
			Unabled.style.display = "block";
			buttonAbled.style.display = "none";
		}
		else {
			Unabled.style.display = "none";
			buttonAbled.style.display = "block";
		}
	}
}