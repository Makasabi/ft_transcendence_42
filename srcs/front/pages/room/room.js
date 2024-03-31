import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import * as Login from "/front/pages/login/login.js";

async function render_room(roomMode)
{
	let user = await fetch("/api/user_management/me", {
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json());

	let dbstuff = await fetch("/api/rooms/create_room", {
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
	console.log("dbstuff:", dbstuff);

	let html = await fetch("/front/pages/room/create.html").then(response => response.text());
	
	html = html.replace("{{roomMode}}", dbstuff.roomMode);
	html = html.replace("{{roomCode}}", dbstuff.code);
	document.querySelector("main").innerHTML = html;

	// returns a FULL page ready to be displayed
}

export class createNormalRoomView extends IView {
	static match_route(route) {
		return route === "/create/normal";
	}

	static async render() {
		render_room("normal");
	}
}

export class createTournamentRoomView extends IView {
	static match_route(route) {
		return route === "/create/tournament";
	}

	static async render() {
		render_room("tournament");
	}
}

export function createRoomMode()
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

}