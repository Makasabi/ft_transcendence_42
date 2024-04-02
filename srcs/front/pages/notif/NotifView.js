import { IView } from "/front/pages/IView.js";
import { HomeView } from "/front/pages/home/home.js";

export class NotifView extends IView {
	static match_route(route) {
		let regex = new RegExp("^/notif/[\\w]+$");
		return regex.test(route);
	}

	// calls HomeView.render
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
		// Call the setMessage function to add the new li element
		setMessage(message);
	};
}


function setMessage(message) {
	console.log('Message:', message);

	// Create a new li element
	var newLi = document.createElement('li');

	// Create a new anchor element
	var newAnchor = document.createElement('a');
	newAnchor.className = 'dropdown-item text-wrap';
	newAnchor.href = '#';
	newAnchor.textContent = message;

	// Append the anchor element to the li element
	newLi.appendChild(newAnchor);

	// Get the ul element with the id "notify"
	var ulElement = document.getElementById('notify');

	// Append the new li element to the ul element
	ulElement.appendChild(newLi);

	// getting object of count
	console.log(document.getElementById('bellCount'));
	// count = document.getElementById('bellCount').getAttribute('data-count');
	// document.getElementById('bellCount').setAttribute('data-count', parseInt(count) + 1);
}