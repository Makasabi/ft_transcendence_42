import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";

/**
 * RoomView class
 * This class is used to render the room page when created or joined by the users
 * Before rendering the room page, it checks if the room code is valid or not
 * If the room code is invalid, it does not render the room page
 * Rooms can also be accessed through url with the room code.
 */
export class RoomView extends IView {
	static match_route(route) {
		if (route.split("/")[1] === "room" && route.split("/")[2].length === 6 && route.split("/")[2] !== undefined) {
			return true;
		} else {
			return false;
		}
	}

	static async render() {
		let code = document.URL.split("/")[4];
		checkRoomCode(code)
			.then(roomCheck => {
				console.log("RoomCheck: ", roomCheck);
				if (roomCheck.status === 404) {
					return;
				}
				console.log("Room status: ", roomCheck.status);
				return roomCheck.status;
			})
			.catch(error => {
				console.error('Error checking room availability:', error);
				return false; // Returning false assuming the room is unavailable in case of error
			});
		let roomInfo = await fetch(`/api/rooms/info/${code}`, {
			headers: {
				'Authorization': `Token ${Login.getCookie('token')}`,}}).then(response => response.json());
		let html = await fetch("/front/pages/room/room.html").then(response => response.text());

		html = html.replace("{{roomMode}}" , roomInfo.roomMode);
		html = html.replace("{{roomCode}}", roomInfo.code);
		document.querySelector("main").innerHTML = html;
	}

}

export class createNormalRoomView extends IView {
	static match_route(route) {
		return route === "/create/normal";
	}

	static async render() {
		create_room("normal");
	}
}

export class createTournamentRoomView extends IView {
	static match_route(route) {
		return route === "/create/tournament";
	}

	static async render() {
		create_room("tournament");
	}
}

async function create_room(roomMode)
{
	let user = await fetch("/api/user_management/me", {
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json());

	let roomdb = await fetch("/api/rooms/create_room", {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`
		},
		body: JSON.stringify({
			'username' : user.username,
			'visibility' : 'private',
			'roomMode' : roomMode,})
	}).then(responsedb => responsedb.json());
	console.log("roomdb:", roomdb);

	let newUrl = "/room/" + roomdb.code;
	let state = { 'code': roomdb.code };
	let title = "Room " + roomdb.code;
	window.history.pushState(state, title, newUrl);
	window.history.replaceState(state, title, newUrl);
	route(newUrl);
}

export async function checkRoomCode(code) {
	try {
		const response = await fetch(`/api/rooms/code/${code}`, {
			method: 'GET',
			headers: {
				'Authorization': `Token ${Login.getCookie('token')}`
			}
		});
		if (!response.ok) {
			throw new Error('Failed to fetch room information');
		}
		return await response.json();
	} catch (error) {
		console.error('Error fetching room information:', error);
		throw error;
	}
}

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