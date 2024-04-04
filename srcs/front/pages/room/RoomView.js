import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import { checkRoomCode } from "/front/pages/room/room.js";

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
	static async render() {
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

		createRoomSocket(roomInfo.room_id);
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
		console.log('Socket closed unexpectedly');
		route("/fullroom");
	};

	// on receiving message on group
	roomSocket.onmessage = function (e) {
		const data = JSON.parse(e.data);
		const message = data.message;
		// check if message is for the user
		if (data.room === roomid) {
			console.log('Message is for room:', roomid);
		}
	};
}