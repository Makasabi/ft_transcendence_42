import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";

/**
 * send a POST request to back to create the tournament record in DB
 * once created, send a websocket message to all players in the room to start the tournament
 * @param {*} roomSocket 
 * @param {*} room_id 
 * @param {*} roomCode 
 */
async function createTournament(roomSocket, room_id, roomCode) {
	let tournament = await fetch (`/api/rooms/create_tournament/${room_id}`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`},
		body: JSON.stringify({
			"room_id": room_id,
			"room_code": roomCode,
		}),
	}).then(response => response.json())

	console.log("Tournament created: ", tournament);
}
