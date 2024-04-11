import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { errorMessage } from "/front/pages/room/roomUtils.js";

/**
 * send a POST request to back to create the tournament record in DB
 * once created, send a websocket message to all players in the room to start the tournament
 * @param {*} roomSocket 
 * @param {*} room_id 
 * @param {*} roomCode 
 */
export async function createTournament(roomSocket, room_id, roomCode) {
	let tournament = await fetch (`/api/rooms/create_tournament/${room_id}`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`},
		body: JSON.stringify({
			"room_id": room_id,
			"room_code": roomCode,
		}),
	}).then(async response => {
		if (response.status === 200) {
			const data = await response.json();
			console.log("data:", data);
			if (data.occupancy < 8) {
				console.error("Not enough players to start tournament");
				errorMessage("You need at least 8 players to start a tournament.");
				response.status === 400;
				return;
			}
			console.log("Tournament created:", data);
			const to_send = JSON.stringify({
				"type": "tournament_start",
				"message": "Tournament starting",
				"room_id": room_id,
				"room_code": roomCode,
			})
			console.log("Sending message to start tournament:", to_send);
			roomSocket.send(to_send);
		} else {
			console.error("Error creating tournament");
		}
	})
}


