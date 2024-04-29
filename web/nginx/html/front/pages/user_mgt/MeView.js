import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { getProfileInfos, getHistoryStats, displayGameBox, APIcall } from "./userMgtUtils.js";

export class MeView extends IView {
	static match_route(route) {
		return route === "/me";
	}

	async render() {
		let html = await fetch("/front/pages/user_mgt/me.html").then(response => response.text());
		let user = await APIcall("/api/user_management/me");

		// profile-infos
		html = await getProfileInfos(html, user);
		// history-stats
		html = await getHistoryStats(html, user);

		let main = document.querySelector("main");
		if (main === null)
			return
		main.innerHTML = html;
		html = await switch2FA(html);
		editProfileButton();
		displayGameBox(user);
		avatarUpload();
	}
}

async function editProfile() {

	let username = document.getElementById("username").textContent;
	let password = document.getElementById("password").value;

	if (username === "") {
		const me = await APIcall("/api/user_management/me");
		document.getElementById("username").textContent = me.username;
		const error_username = document.getElementById("error_username");
		if (error_username === null)
			return;
		error_username.textContent = "Username cannot be empty";
		error_username.hidden = false;
		setTimeout(() => {
			error_username.hidden = true;
		}, 2000);
		return;
	}
	console.log("Password: ", password);
	let editProfile = await fetch('/api/user_management/edit_profile', {
		method: 'POST',
		headers: {
			'Content-type' : 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`
		},
		body: JSON.stringify({ 'username' : username, 'password' : password}),

	}).then(response => {
		if (response.ok)
			return (response.json());
		else {
			return response.json().then(data => {
				let error_field
				if (data.password !== undefined)
					error_field = document.getElementById("error_password");
				else
					error_field = document.getElementById("error_username");
				if (error_field === null)
					return ;
				error_field.textContent = data.error;
				error_field.hidden = false;
				document.getElementById("username").textContent = data.username;
				setTimeout(() => {
					error_field.hidden = true;
				}, 3000);
			});
		}
	});
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
	let button = document.getElementById("edit-button");
	let password = document.getElementById("password");
	if (button === null || password === null)
		return false;
	button.textContent = "Edit my Profile";
	password.style.display = "none";
	return false;
}

function editProfileButton()
{
	const edit_button = document.getElementById("edit-button");
	if (edit_button === null)
		return;
	edit_button.textContent = "Edit my Profile";
	const editables = document.getElementsByClassName("edit");
	let edit = false;

	for (let editable of editables) {
		editable.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				edit_button.click();
		}});
	}

	const avatarContainer = document.querySelector(".avatar-container");
	if (avatarContainer === null)
		return;

	edit_button.addEventListener("click", () => {
		if (edit === true) {
			editProfile();
			edit = editModeOff(editables);
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
	if (avatarInput === null)
		return;
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
			if (data.file_path) {
				const avatarImg = document.querySelector(".avatar_img");
				avatarImg.src = "/front/ressources/uploads/" + file.name;
			}
		} catch (error) {
			// console.error("Error uploading avatar:", error);
			const error_field = document.getElementById("error_username");
				if (error_field === null)
					return ;
				error_field.textContent = "Can't upload this image, sorry !";
				error_field.hidden = false;
				setTimeout(() => {
					error_field.hidden = true;
				}, 3000);
		}
	});
}

async function switch2FA(html) {
	const switchElement = document.getElementById('2fa-switch');
	if (switchElement === null)
		return;
	const twoFA = await APIcall("/api/user_management/twoFA");
	if (twoFA.twoFA === true)
		switchElement.checked = true;
	else
		switchElement.checked = false;
	switchElement.addEventListener('change', async function(event) {
		const data = await fetch('/api/user_management/switch_twoFA', {
			method: 'POST',
			headers: {'Authorization': `Token ${Login.getCookie('token')}`},
			body: JSON.stringify({ 'username' : username, 'password' : password}),
		}).then(response => response.json());

		if (data['twoFA'] === true)
		{
			const foregroundBox = document.createElement('div');
			foregroundBox.classList.add('foreground-box');
			foregroundBox.setAttribute("id", "qr_code");

			const notificationsContainer = document.createElement('div');
			notificationsContainer.classList.add('notifications-container');
			foregroundBox.appendChild(notificationsContainer);

			//handle errors
			const qr_code = document.createElement('img');
			qr_code.src = await fetch("/api/auth/totp_create/", {
				headers: { 'Authorization': `Token ${Login.getCookie('token')}`}
			})
				.then(response => response.blob())
				.then(blob => URL.createObjectURL(blob))
			qr_code.setAttribute("id", "qr-code");

			const closeForegroundBox = function(event) {
				foregroundBox.remove();
				document.removeEventListener('click', closeForegroundBox);

				let newUrl = document.URL.split('#')[0];
				let state = 0;
				let title = "Transcendence";
				window.history.pushState(state, title, newUrl);
				window.history.replaceState(state, title, newUrl);
			}

			const form = document.createElement('form')
			const btn = document.createElement('button');
			btn.textContent = "Done";
			btn.addEventListener('click', closeForegroundBox);

			form.appendChild(btn);
			notificationsContainer.appendChild(qr_code);
			notificationsContainer.appendChild(form);
			document.body.appendChild(foregroundBox);

			event.stopPropagation();
		}
	});
}
