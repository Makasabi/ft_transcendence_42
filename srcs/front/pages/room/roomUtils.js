import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import { checkRoomCode } from "/front/pages/room/room.js";

export async function	addPlayer(data) {

	console.log("Add Player data: ", data);

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
		playerDiv.innerHTML = `<img src="${player.avatar_file}" class="room_avatar" alt"${player.username} avatar">`
		+ `<div id="master">`
		+ `<img id="crown" src="/front/ressources/img/svg/icons/crown.svg" alt="Room Master">` 
		+ `<p> ${player.username}</p>`
		+ `</div>`;
	}
	else {
		playerDiv.innerHTML = `<img src="${player.avatar_file}" class="room_avatar" alt"${player.username} avatar">` + `<p>${player.username}</p>`;
	}
	updateStartButton(data.player_id, data.is_master);
	playerList.appendChild(playerDiv);
}

export async function removePlayer(data) {
	console.log("Remove Player data: ", data);
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
	console.log(">>---->>> Update Player data: ", data);
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
	newMaster.innerHTML = `<img src="${player.avatar_file}" class="room_avatar" alt"${player.username} avatar">`
	+ `<div id="master">`
	+ `<img id="crown" src="/front/ressources/img/svg/icons/crown.svg" alt="Room Master">` 
	+ `<p> ${player.username}</p>`
	+ `</div>`;
	playerList.replaceChild(newMaster, oldMaster);
	console.log(">>---->>> New Master: ", newMaster);
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
			console.log("I am the master of the room");
			Unabled.style.display = "none";
			buttonAbled.style.display = "block";
		}
		else {
			console.log("I am not the master of the room");
			Unabled.style.display = "block";
			buttonAbled.style.display = "none";
		}
	}
}
/*
TODO: When master leaves room, master role is given to another player

TODO: When last player leaves room --> define what to do with room record.

TODO: When a user refreshes the page -> check if he already occupies the room - delete old record and create new one.
*/
