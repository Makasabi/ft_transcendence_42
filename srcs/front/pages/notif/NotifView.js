import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { HomeView } from "/front/pages/home/home.js";

export class NotifView extends IView {
	static match_route(route) {
		let regex = new RegExp("^/notif/[\\w]+$");
		return regex.test(route);
	}

	async render() {
		console.log("NotifView.render");
		// HomeView.render();
		handleNotificationDot();
		displayNotifications();
	}
}


// create Notification socket for the user
export function createNotificationSocket(username) {
	// console.log('Creating socket for:', username);
	const notifySocket = new WebSocket(
		'ws://'
		+ window.location.host
		+ '/ws/notif/'
		+ username
	);
	if (notifySocket.error) {
		console.log('Notif Error creating socket');
		return;
	}
	else
		handleNotificationDot();

	// on socket open
	notifySocket.onopen = function (e) {
		// console.log('Notif Socket successfully connected for:', username);
	};

	// on socket close
	notifySocket.onclose = function (e) {
		console.log('Notif Socket closed unexpectedly');
		switch (e.code) {
			case 1000:
				console.log('Socket closed normally');
				break;
			default:
				console.log('Socket closed unexpectedly');
		}
	};
	
	notifySocket.onmessage = function (e) {
		const data = JSON.parse(e.data);
		const message = data.message;
		if (data.user === username) {
			displayNotifDot(message);
			// console.log('Message is for ', username);
		}
	};
	return notifySocket;
}


function renderAcceptIcon(notification, actionIcons) {
	if (notification.type === 'friend_request') {
		const acceptIcon = document.createElement('span');
		acceptIcon.textContent = 'V';
		acceptIcon.classList.add('action-icon');
		acceptIcon.addEventListener('click', () => {
			// Handle friend request acceptance
			console.log('Friend request accepted');
			// fetch(`/api/user_management/add_friend/${notification.user}`, {
			//     method: 'POST',
			//     headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
			// }).then(response => {
			//     if (response.ok) {
			//         console.log('Friend request accepted');
			//     } else {
			//         console.error('Failed to accept friend request');
			//     }
			// });
		});
		actionIcons.appendChild(acceptIcon);
	}
}

function renderDeclineIcon(notificationElement) {
	const declineIcon = document.createElement('span');
	declineIcon.textContent = 'X';
	declineIcon.classList.add('action-icon');
	declineIcon.addEventListener('click', (event) => {
		console.log('Notification deleted');
		// api call to delete notification from DB
		const notificationElement = event.target.closest('.notification');
		fetch("/api/notif/delete_notif/" + notificationElement.id, {
			method: 'DELETE',
			headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
		})
		
		if (notificationElement) {
			notificationElement.style.display = 'none';
		}
	});
	return declineIcon;
}

function renderNotifIcons(notification, notificationElement) {
	const actionIcons = document.createElement('div');
	actionIcons.classList.add('action-icons');

	renderAcceptIcon(notification, actionIcons);
	const declineIcon = renderDeclineIcon(notificationElement);
	actionIcons.appendChild(declineIcon);

	notificationElement.appendChild(actionIcons);
}

function displayNotifBox(notifs) {
	const notificationsLink = document.getElementById('notif-box');
		notificationsLink.addEventListener("click", (event) => {
			setNotifSeen();
			event.stopPropagation();

			// Create and display the foreground box
			const foregroundBox = document.createElement('div');
			foregroundBox.classList.add('foreground-box');
			document.body.appendChild(foregroundBox);
	
			const notificationsContainer = document.createElement('div');
			notificationsContainer.classList.add('notifications-container');
			foregroundBox.appendChild(notificationsContainer);

			notifs.forEach(notification => {
				const notificationElement = document.createElement('div');
				notificationElement.classList.add('notification');
				notificationElement.textContent = notification.message;
				notificationElement.id = notification.notif_id;
				notificationsContainer.appendChild(notificationElement);
				renderNotifIcons(notification, notificationElement);
			});

			const closeForegroundBox = function(event) {
				if (!foregroundBox.contains(event.target)) {
					foregroundBox.remove();
					document.removeEventListener('click', closeForegroundBox);
				}
			}
			document.addEventListener('click', closeForegroundBox);
			event.stopPropagation();
		});
}

function setNotifSeen() {
	fetch('/api/notif/set_seen', {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json())
}

async function displayNotifications () {
	let notifs = await fetch('/api/notif/get_notifs/all', {
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json())
	// console.log('Notifications fetched', notifs)
	displayNotifBox(notifs);
}

// display new notification red dot
function displayNotifDot() {
	document.getElementById('notificationDot').style.display = 'inline-block';
}

// Handle red dot for Notifications
async function handleNotificationDot() {	
	await fetch('/api/notif/get_notifs/unseen',{
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json())
	.then(data => {
		if (data.length > 0)
			displayNotifDot();
	})
	.catch((error) => {
		console.error('Error:', error);
	});
}



// @TODO
// on accept, add friend to DB and delete notification from DB

// USER_MGT : unilateral friendship (we love consent in this house)
// USER_MGT : replace Add Friend with Accept request if other user sent request
// USER_MGT : friends page