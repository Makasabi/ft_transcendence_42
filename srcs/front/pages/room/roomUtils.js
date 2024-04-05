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
	let Unabled = document.getElementById("unauthorosedToStart");
	let buttonAbled = document.querySelector(".cta");

	playerDiv.className = "player_box";

	playerDiv.id = `player${data.player_id}`;
	if (data.is_master === true) {
		playerDiv.innerHTML = `<img src="${player.avatar_file}" class="room_avatar" alt"${player.username} avatar">`
		+ `<div id="master">`
		+ `<img id="crown" src="/front/ressources/img/svg/icons/crown.svg" alt="Room Master">` 
		+ `<p> ${player.username}</p>`
		+ `</div>`;
		Unabled.style.display = "none";
		buttonAbled.style.display = "block";
	}
	else {
		playerDiv.innerHTML = `<img src="${player.avatar_file}" class="room_avatar" alt"${player.username} avatar">` + `<p>${player.username}</p>`;
		Unabled.style.display = "block";
		buttonAbled.style.display = "none";
		
	}
	playerList.appendChild(playerDiv);
}

export async function removePlayer(data) {
	let playerList = document.querySelector(".playersInTheRoom");
	let playerDiv = document.getElementById(`player${data.player_id}`);
	playerList.removeChild(playerDiv);
}

/*

TODO: When master leaves room, master role is given to another player
TODO: When last player leaves room --> define what to do with room record.

TODO: When a user refreshes the page -> check if he already occupies the room - delete old record and create new one.
*/
