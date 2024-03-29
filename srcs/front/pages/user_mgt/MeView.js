import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { getProfileInfos, getHistoryStats } from "/front/pages/user_mgt/user_mgt.js";

export class MeView extends IView {
	static match_route(route) {
		return route === "/me";
	}

	static async render() {
		let html = await fetch("/front/pages/user_mgt/me.html").then(response => response.text());
		let user = await fetch("/api/user_management/me", {
			headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
		}).then(response => response.json());
	
		// profile-infos
		html = getProfileInfos(html, user);
		// history-stats
		html = getHistoryStats(html, user);

		document.querySelector("main").innerHTML = html;
		editProfileButton();
	}
}

async function editProfile() {

	let username = document.getElementById("username").textContent;
	let email = document.getElementById("email").textContent;
	let password = document.getElementById("password").textContent;
	
	const response = await fetch('api/user_management/edit_profile', {
		method: 'POST',
		headers: {
			'Content-type' : 'application/json', 
			'Authorization': `Token ${Login.getCookie('token')}`
		},
		body: JSON.stringify({ 'username' : username, 'email' : email, 'password' : password}),
	
	}).then(response => response.json());
}

function editModeOn(editables) {

	for (let editable of editables) {
		editable.contentEditable = true;
		editable.style.padding = "5px";
		editable.style.backgroundColor = "#dedede";
		editable.style.color = "#353536";
		editable.style.borderRadius = "5px";
	}
	document.getElementById("edit-button").textContent = "Save";
	document.getElementById("password").textContent = "*********";
	return true;
}

function editModeOff(editables) {

	for (let editable of editables) {
		editable.contentEditable = false;
		editable.style.removeProperty("style");
		editable.style.removeProperty("background-color");
		editable.style.removeProperty("border");
		editable.style.color = "#dedede";
	}
	document.getElementById("password").textContent = "";
	document.getElementById("edit-button").textContent = "Edit my Profile"; 
	return false;
}

function editProfileButton()
{
	document.getElementById("edit-button").textContent = "Edit my Profile"; 
	const editables = document.getElementsByClassName("edit");
	let edit = false;
	document.getElementById("edit-button").addEventListener("click", () => {
		if (edit === true)
		{
			editProfile();
			edit = editModeOff(editables);
		}
		else
			edit = editModeOn(editables);
	});
}