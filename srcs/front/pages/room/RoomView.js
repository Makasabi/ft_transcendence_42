import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import { checkRoomCode } from "/front/pages/room/room.js";
import { addPlayer, removePlayer} from "/front/pages/room/roomUtils.js";

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
	 *
	 * if roomcode is valid, it renders the room page
	 * TODO: else it redirects to unknown room code view -> explaining that the room code is either invalid or the room has been closed since.
	 */
	async render() {
		let code = document.URL.split("/")[4];
		checkRoomCode(code)
			.then(roomCheck => {
				if (roomCheck.status === false) {
					route("/unknown");
				}
				console.log("Room status: ", roomCheck.status);
			})
			.catch(error => {
				console.error('Error checking room availability:', error);
				route("/unknown");
			});
		let roomInfo = await fetch(`/api/rooms/info/${code}`, {
			headers: {
				'Authorization': `Token ${Login.getCookie('token')}`,}}).then(response => response.json());
		let html = await fetch("/front/pages/room/room.html").then(response => response.text());

		html = html.replace("{{roomMode}}" , roomInfo.roomMode);
		html = html.replace("{{roomCode}}", roomInfo.code);
		document.querySelector("main").innerHTML = html;
		
		this.roomSocket = createRoomSocket(roomInfo.room_id);

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
			}).then(response => {
				if (response.status === 200) {
					this.roomSocket.send(JSON.stringify({
						"message": "Game starting",
						"room": roomInfo.room_id,
					}));
				} else {
					console.error("Error starting game");
				}
			})
		});
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
	if (roomSocket.error) {
		console.log('Error creating socket');
		return;
	}

	// on socket open
	roomSocket.onopen = function (e) {
		console.log('Socket successfully connected.');
	};

	// on socket close
	roomSocket.onclose = function (e) {
		console.log('--------> Socket closing:', e.code, e.reason);
		const code = e.code;
		const reason = e.reason;
		switch (code) {
			case 1000:
				console.log('Socket closed normally');
				break;
			case 3001:
				console.log('Room is already full');
				route("/fullroom");
				break;
			case 3002:
				console.log('Unauthentified user');
				route("/home");
				break;
			default:
				console.log(reason);
		}
	};

	// on receiving message on group
	roomSocket.onmessage = function (e) {
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
			case 'game_start':
				console.log('Game starting');
				route(`/game/${roomid}`);
				break;
			default:
				console.log('Unknown message type:', type);
		}
	};

	return roomSocket;
}