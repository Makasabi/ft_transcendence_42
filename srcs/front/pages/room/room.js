import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";

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
	 */
	static async render() {
		let code = document.URL.split("/")[4];
		checkRoomCode(code)
			.then(roomCheck => {
				console.log("RoomCheck: ", roomCheck);
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
	}

}

export class UnknownRoomView extends IView {

	static match_route(route) {
		return route === "/unknown" 
	}

	static async render() {
		let html = await fetch("/front/pages/room/unknown.html").then(response => response.text());
		document.querySelector("main").innerHTML = html;

		let backToHome = document.getElementById("backHomeUnknownRoom");
		backToHome.addEventListener("click", (e) => {
			e.preventDefault();
			route("/home");
		});
	}
}

/**
 * createRoomView class
 *
 * this buffer class is only used to create a normal room in the db.
	 *  @returns {void} routes to the room page after creating a room in the db
 * 
 */
export class createRoomView extends IView {
	static match_route(route) {
		if (route === "/create/normal" || route === "/create/tournament") {
			return true;
		} else {
			return false;
		}
	}

	static async render() {
		console.log(document.URL)
		let roomMode = document.URL.split("/")[4];
		console.log("roomMode: ", roomMode);
		
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
}

/**
 * Verifies if the room code is valid or not
 * @param {string} code
 * @returns {Response} {status: 200, message: "Room exists"} or {status: 404, message: "Room does not exist"}
 */
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

/**
 * Collects response from the radio buttons and creates a room accordingly
 * @returns {void} routes to the selected room creation mode
 */
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

/**
 * Collects response from the input field and joins the room accordingly
 * @return {void} routes to the room page

 */
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