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
		HomeView.render();
	}
}

// create Notification socket for the user
export function createNotificationSocket(username) {
	console.log('Creating socket for:', username);
	const notifySocket = new WebSocket(
		'ws://'
		+ window.location.host
		+ '/ws/notif/'
		+ username
	);
	if (notifySocket.error) {
		console.log('Error creating socket');
		return;
	}
	else
		handleNotificationDot();

	// on socket open
	notifySocket.onopen = function (e) {
		console.log('Socket successfully connected for:', username);
	};

	// on socket close
	notifySocket.onclose = function (e) {
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
		// check if message is for the user
		if (data.user === username) {
			// console.log('Message is for ', username);
			newNotification(message);
		}
	};
	return notifySocket;
}

// display new notification red dot
function newNotification(message) {

	var notificationDot = document.getElementById('notificationDot');
	if (notificationDot) {
		console.log('Notification dot exists');
		notificationDot.style.display = 'inline-block';
	}
	else {
		console.log('Notification dot does not exist');
	}
}

// Handle red dot for Notifications
async function handleNotificationDot() {	
	var notificationDot = document.getElementById('notificationDot');
	await fetch('/api/notif/get_notifs',{
		headers: { 'Authorization': `Token ${Login.getCookie('token')}` }
	}).then(response => response.json())
	.then(data => {
		if (data.length > 0)
			newNotification();
	})
	.catch((error) => {
		console.error('Error:', error);
	});
}
