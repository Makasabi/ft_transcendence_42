function route(path) {
	window.history.pushState({}, "", path);
	handleLocation();
};

async function handleLocation() {
	// @TODO dynamic body content
};

document.addEventListener("DOMContentLoaded", function () {
	handleLocation();

	window.onpopstate = function(event) {
		handleLocation();
	};
});
