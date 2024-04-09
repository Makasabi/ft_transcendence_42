import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";

export class NotifView extends IView {
	static match_route(route) {
		let regex = new RegExp("^/notif/[\\w]+$");
		return regex.test(route);
	}

	async render() {
		// console.log("NotifView.render");
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

function acceptFriend(notification) {
	fetch(`/api/user_management/add_friend/` + notification.sender_id, {
		method: 'POST',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	finish();
}

function acceptGameInvitation(notification) {
	console.log('notification: ', notification);
	finish();
	document.querySelector('.foreground-box').remove();

	route(`/room/${notification.room_code}`);
}

function finish(){
	const notificationElement = event.target.closest('.notification');
	fetch("/api/notif/delete_notif/" + notificationElement.id, {
		method: 'DELETE',
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	})
	if (notificationElement) {
		notificationElement.style.display = 'none';
	}

}

function renderAcceptIcon(notification, actionIcons) {
	if (notification.type === 'friend_request' || notification.type === 'game_invitation') {
		const acceptIcon = document.createElement('span');
		acceptIcon.textContent = 'V';
		acceptIcon.classList.add('action-icon');
		acceptIcon.addEventListener('click', (event) => {
			// Handle friend request acceptance
			console.log('notification.sender_id', notification.sender_id);
			if (notification.type === 'friend_request')
				acceptFriend(notification);
			else
				acceptGameInvitation(notification);
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

async function displayNotifBox(notifs) {
	const notificationsLink = document.getElementById('notif-box');
		notificationsLink.addEventListener("click", async (event) => {
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
