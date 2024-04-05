import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import { checkRoomCode } from "/front/pages/room/room.js";


export async function	addPlayer(data) {

	console.log("data: ", data);

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
	playerDiv.innerHTML = `<img src="${player.avatar_file}" alt"${player.username} avatar">` + `<p>${player.username}</p>`;
	playerList.appendChild(playerDiv);


}

export async function removePlayer(data) {
	let playerList = document.querySelector(".playersInTheRoom");
	let playerDiv = document.getElementById(`player${data.player_id}`);
	playerList.removeChild(playerDiv);
}

/*
TODO: Master -> purple border to identify him

TODO: Only Master can start the game 
TODO: Need to change room dom for a standar 'grey' button saying only master can start
TODO: When master leaves room, master role is given to another player
TODO: When last player leaves room --> define what to do with room record.
*/
