import { IView } from "/front/pages/IView.js";
import { HomeView } from "/front/pages/home/home.js";

export class NotifView extends IView {
	static match_route(route) {
		let regex = new RegExp("^/notif/[\\w]+$");
		return regex.test(route);
	}

	static async render() {
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

	// on socket open
	notifySocket.onopen = function (e) {
		console.log('Socket successfully connected.');
	};

	// on socket close
	notifySocket.onclose = function (e) {
		console.log('Socket closed unexpectedly');
	};

	// on receiving message on group
	notifySocket.onmessage = function (e) {
		const data = JSON.parse(e.data);
		const message = data.message;
		// check if message is for the user
		if (data.user === username) {
			console.log('Message is for ', username);
			newNotification(message);
		}
	};
}

// display new notification red dot
function newNotification(message) {
	console.log('Message:', message);

	var notificationDot = document.getElementById('notificationDot');
	if (notificationDot) {
		console.log('Notification dot exists');
		notificationDot.style.display = 'inline-block';
	}
	else {
		console.log('Notification dot does not exist');
	}
}
