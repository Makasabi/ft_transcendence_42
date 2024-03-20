
let is_logged = false;



	/*** rendering functions ***/
async function footer()
{
	document.querySelector("footer").innerHTML = await fetch("/static/footer.html").then(response => response.text());
}

async function header()
{
	document.querySelector("header").innerHTML = await fetch("/static/header.html").then(response => response.text());
}

async function signup()
{
	document.querySelector("main").innerHTML = await fetch("/static/signup.html").then(response => response.text());
}

async function login()
{
	document.querySelector("main").innerHTML = await fetch("/static/login.html").then(response => response.text());
}

async function home()
{
	document.querySelector("main").innerHTML = await fetch("/static/home.html").then(response => response.text());

}

	/*** Utilities ***/
function route(path) {
	window.history.pushState({}, "", path);
	handleLocation();
};

function is_log() {
	if (!is_logged)
		route("/login");
	else
		route("/home");
}
async function handleLocation() {
	const routes = [
		{path : "/login", view : login},
		{path : "/signup", view : signup},
		{path : "/home", view : home},
	];

	const path = window.location.pathname;
	let match = {path : "/home", view : home};

	if (path === '/test')
	{
		document.querySelector("main").innerHTML = `<h1> FDP </h1>`;
		return ;
	}
	routes.forEach(route => {
		if (route.path === path)
			match = route;
	})
	match.view();
};

is_log();

	/*** Events ***/
document.addEventListener("DOMContentLoaded", function () {
	footer();
	header();

	window.onpopstate = function(event) {
		handleLocation();
	};
});

document.querySelector("main").addEventListener("click", async (e) => {
	if (e.target.id === "submit-login")
	{
		e.preventDefault();
		console.log("login");
		const form = document.getElementById("login-form");
		const username = form.elements.login_username.value;
		const password = form.elements.login_password.value;

		await fetch('api/auth/login/', {
				method: 'POST',	
				headers: { 
					'Content-type' : 'application/json',
				},
				body: JSON.stringify({ 'username' : username , 'password' : password })
			})
			.then(response => {
				if (response.ok)
					return (response.json());
				else
				{
					console.log("Error from server");
					console.log(response.json());
					return (response.json());
				}

			})
			.then(data => {
				if (data == null)
					return;
				is_logged = true;
				route("/home");
				console.log(data.token);
			});
	}
	else if (e.target.matches("[data-route]"))
	{
		e.preventDefault();
		route(e.target.href);
	}
	else if (e.target.id === "submit-signup")
	{
		e.preventDefault();
		console.log('register');
	
		const form = document.getElementById("signup-form");
		const username = form.elements.signup_username.value;
		const password = form.elements.signup_password.value;
		const email = form.elements.signup_email.value;
	
		await fetch('api/auth/signup/', {
				method: 'POST',
				headers: { 'Content-type' : 'application/json' },
				body: JSON.stringify({ 'username' : username , 'password' : password , 'email' : email})
			})
			.then(response => {
				if (response.ok)
					return (response.json());
				else
				{
					console.log(response.json());
					return (null);
				}
			})
			.then(data => {
				if (!data)
					return ;
				else
				{
					route("/login");
					console.log(data);
					console.log("Registration successfull");
				}
			});
	}
});
