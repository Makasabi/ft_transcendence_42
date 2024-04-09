import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";
import { checkRoomCode } from "/front/pages/room/roomUtils.js";

/**
 * createRoomView class
 *
 * this buffer class is only used to create a room in the db.
	 *  @returns {void} routes to the room page after creating a room in the db
 * 
 */
export class CreateRoomView extends IView {
	static match_route(route) {
		if (route === "/create/Normal" || route === "/create/Tournament") {
			return true;
		} else {
			return false;
		}
	}

	async render() {
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
				'visibility' : 'Private',
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