import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import { checkRoomCode, addFriendList, inviteFriend } from "/front/pages/room/roomUtils.js";
import { addPlayer, removePlayer, updatePlayer, } from "/front/pages/room/roomWebsockets.js";
import { createTournament } from "/front/pages/room/tournamentUtils.js";

/**
 * RoomView class
 *
 * This class is used to render the room page when created or joined by the users
 */
export class RoomView extends IView {
	static match_route(route) {
		if (route.split("/")[1] === "room" && route.split("/")[2].length === 6 && route.split("/")[2] !== undefined) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Renders the room page after checking if the roomCode is valid or not
	 * if roomcode is valid, it renders the room page
	 */
	async render() {

		let code = document.URL.split("/")[4];
		let roomExists = await checkRoomCode(code);
		if (roomExists === false) {
			route("/unknown");
			return;
		}

		let roomInfo = await fetch(`/api/rooms/info/${code}`, {
			headers: {
				'Authorization': `Token ${Login.getCookie('token')}`,}}).then(response => response.json());
		let html = await fetch("/front/pages/room/room.html").then(response => response.text());

		html = html.replace("{{roomVisibility}}", roomInfo.visibility);
		html = html.replace("{{roomMode}}" , roomInfo.roomMode);
		html = html.replace("{{roomCode}}", roomInfo.code);
		document.querySelector("main").innerHTML = html;

		addFriendList();
		inviteFriend(roomInfo.code, roomInfo.roomMode);

		this.roomSocket = createRoomSocket(roomInfo.room_id);

		if (roomInfo.roomMode === "tournament") {
			await document.getElementById("start").addEventListener("click", async () => {
				createTournament(this.roomSocket ,roomInfo.room_id, roomInfo.code);
			});
		}
		else {
			await document.getElementById("start").addEventListener("click", () => {
				console.log("Starting game");
				fetch(`/api/game/start/${roomInfo.room_id}`, {
					method: "POST",
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Token ${Login.getCookie('token')}`,
					},
					body: JSON.stringify({
						"room_id": roomInfo.room_id,
					}),
				}).then(async response => {
					if (response.status === 200) {
						const data = await response.json();
						const to_send = JSON.stringify({
							"type": "start",
							"message": "Game starting",
							"game_id": data.game_id,
						})
						console.log("Sending message to start game:", to_send);
						this.roomSocket.send(to_send);
					} else {
						console.error("Error starting game");
					}
				})
			});
		}
	}

	destroy() {
		console.log("Destroying room view");
		if (this.roomSocket) {
			this.roomSocket.close();
		}
	}
}

/**
 * function to create a new socket when a user enters a room
 * (upon creation or joining (with code in URL, via home form, or via invite notification))
 */

export function createRoomSocket(roomid) {
	console.log('Creating socket for room:', roomid);
	const roomSocket = new WebSocket(
		'ws://'
		+ window.location.host
		+ '/ws/room/'
		+ roomid,
	);

	roomSocket.onerror = function (e) {
		console.log('Rooms - Socket error:', e);
		route("/home");
	};

	// on socket open
	roomSocket.onopen = function (e) {
		console.log('Rooms - Socket successfully connected.');
	};

	// on socket close
	roomSocket.onclose = function (e) {
		console.log('Rooms - Socket closing:', e.code, e.reason);
		const code = e.code;
		const reason = e.reason;
		switch (code) {
			case 1000:
				console.log('Rooms - Socket closed normally');
				break;
			case 3001:
				console.log('Room - is already full');
				route("/fullroom");
				break;
			case 3002:
				console.log('Rooms - Unauthentified user');
				route("/home");
				break;
			default:
				console.log(reason);
		}
	};

	// on receiving message on group
	roomSocket.onmessage = function (e) {
		// console.log('Rooms - Message received:', e.data);
		const data = JSON.parse(e.data);
		const type = data.type;
		switch (type) {
			case 'new_player':
				console.log('New player joined:', data.player_id);
				addPlayer(data);
				break;
			case 'remove_player':
				console.log('Player left:', data.player_id);
				removePlayer(data);
				break;
			case 'update_player':
				console.log('Player updated:', data.player_id);
				updatePlayer(data);
				break;
			case 'start':
				console.log('Game starting');
				route(`/game/${data.game_id}`);
				break;
			case 'tournament_start':
				console.log('Tournament starting');
				route(`/tournament/${data.tournament_id}`);
				break;
			default:
				console.log('Unknown message type:', type);
		}
	};

	return roomSocket;
}