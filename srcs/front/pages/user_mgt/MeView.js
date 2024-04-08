import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { getProfileInfos, getHistoryStats } from "/front/pages/user_mgt/user_mgt.js";

export class MeView extends IView {
	static match_route(route) {
		return route === "/me";
	}

	async render() {
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
		avatarUpload(); 
	}
}

async function editProfile() {

	let username = document.getElementById("username").textContent;
	let password = document.getElementById("password").textContent;
	
	const response = await fetch('api/user_management/edit_profile', {
		method: 'POST',
		headers: {
			'Content-type' : 'application/json', 
			'Authorization': `Token ${Login.getCookie('token')}`
		},
		body: JSON.stringify({ 'username' : username, 'password' : password}),
	
	}).then(response => response.json());
}

function editModeOn(editables) {

	for (let editable of editables) {
		editable.contentEditable = true;
		editable.style.padding = "5px";
		editable.style.backgroundColor =  "var(--light)"
		editable.style.color = "var(--dark)";
		editable.style.borderRadius = "5px";
	}
	document.getElementById("edit-button").textContent = "Save";
	document.getElementById("password").style.display = "inline";
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
	document.getElementById("edit-button").textContent = "Edit my Profile"; 
	document.getElementById("password").style.display = "none";
	return false;
}

function editProfileButton()
{
	document.getElementById("edit-button").textContent = "Edit my Profile"; 
	const editables = document.getElementsByClassName("edit");
	let edit = false;
	

	const avatarContainer = document.querySelector(".avatar-container");
	document.getElementById("edit-button").addEventListener("click", () => {
		if (edit === true) {
			editProfile();
			edit = editModeOff(editables);
			// Remove overlay if edit mode is turned off
			avatarContainer.classList.remove("edit-mode");
		} else {
			edit = editModeOn(editables);
			// Add overlay if edit mode is turned on
			avatarContainer.classList.add("edit-mode");
		}
	});
}

function avatarUpload() {
	const avatarInput = document.getElementById("avatar-upload");
	avatarInput.addEventListener("change", async () => {
		const file = avatarInput.files[0];
		const formData = new FormData();
		formData.append("avatar_file", file);

		try {
			const response = await fetch("/api/user_management/upload_avatar", {
				method: "POST",
				headers: {
					'Authorization': `Token ${Login.getCookie('token')}`
				},
				body: formData
			});
			const data = await response.json();
			console.log(data);
			// Handle response as needed
			console.log("Avatar upload successful!");
			if (data.file_path) {
				const avatarImg = document.querySelector(".avatar_img");
				avatarImg.src = data.file_path;
			}
		} catch (error) {
			console.error("Error uploading avatar:", error);
		}
	});
}