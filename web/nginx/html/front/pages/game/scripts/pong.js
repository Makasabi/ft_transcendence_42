import {RenderingContext} from "./rendering_context.js";
import {GameObject} from "./game_object.js";
import {Ball} from "./ball.js";
import {Player} from "./player.js";
// import { mat4 } from '/front/gl-matrix/esm/index.js';

export class GameContext {
	rendering_context;
	websocket;
	arena;
	last_time = performance.now();
	end = false;
	ready = false;
	pong = false;

	constructor(game_id) {
		this.rendering_context = new RenderingContext();
		this.static_objects = [];

		this.attribute_websocket(game_id);
		this.events(this);
	}

	destroy() {
		console.log("GameContext.destroy");
		window.removeEventListener("resize", resize_canvas);
		document.removeEventListener("keydown", keydown_event);
		document.removeEventListener("keyup", keyup_event);
		this.websocket.close();
		this.end = true;
	}

	attribute_websocket(game_id) {
		let game = this;
		this.websocket = new WebSocket(
			'wss://'
			+ window.location.host
			+ '/ws/game/'
			+ game_id,
		);

		this.websocket.onerror = function(e) {
			console.log('Game socket error:', e);
			game.end = true;
		};

		this.websocket.onopen = function() {
			console.log('Game socket open');
			game.ready = true;
		};

		this.websocket.onclose = function() {
			console.log('Game socket closed');
			game.end = true;
		};

		this.websocket.onmessage = function(e) {
			if (e.data === "pong") {
				game.pong = true;
				return;
			}
			const data = JSON.parse(e.data);
			const type = data.type;
			if (type === "update") {
				game.state = data;
			}
			else if (type === "error") {
				console.error("Game error", data);
				game.end = true;
			}
			else if (type === "end") {
				game.ranking = data.player_ranking;
				game.end = true;
			}
		};
	}

	events(game) {
		window.addEventListener("resize", resize_canvas);

		let x_rotate_slider = document.querySelector("#x_rotation");
		let y_rotate_slider = document.querySelector("#y_rotation");
		let z_rotate_slider = document.querySelector("#z_rotation");
		let reset_rotation_button = document.querySelector("#reset_rotation");

		function rotate_view(game) {
			game.rendering_context.rotate_view([x_rotate_slider.value * Math.PI / 180., y_rotate_slider.value * Math.PI / 180., z_rotate_slider.value * Math.PI / 180.]);
		}

		x_rotate_slider.addEventListener("input", rotate_view.bind(null, game));
		y_rotate_slider.addEventListener("input", rotate_view.bind(null, game));
		z_rotate_slider.addEventListener("input", rotate_view.bind(null, game));

		reset_rotation_button.addEventListener("click", function() {
			x_rotate_slider.value = 180;
			y_rotate_slider.value = 180;
			z_rotate_slider.value = 180;
			rotate_view(game);
		});

		document.game_socket = this.websocket;
		document.addEventListener("keydown", keydown_event);
		document.addEventListener("keyup", keyup_event);
	}

	async load() {
		let model_file;
		this.models = {};

		model_file = await fetch("/front/pages/game/models/arena.json");
		this.models.arena = await model_file.json();

		model_file = await fetch("/front/pages/game/models/pilar.json");
		this.models.pilar = await model_file.json();

		model_file = await fetch("/front/pages/game/models/paddle.json");
		this.models.paddle = await model_file.json();

		model_file = await fetch("/front/pages/game/models/puck.json");
		this.models.puck = await model_file.json();

		model_file = await fetch("/front/pages/game/models/cube.json");
		this.models.cube = await model_file.json();
	}

	create_static_objects() {
		let object;

		//console.log(this.state);
		{
			object = new GameObject(this.models.arena);
			object.position = [this.state.center_x, 0, this.state.center_y];
			object.scale = [this.state.width / 2, 1, this.state.height / 2];
			this.static_objects.push(object);
		}

		let pilar_size = this.state.pilars[0][0][0] - this.state.pilars[0][3][0];
		let pilar_height = pilar_size/ 1.5;
		{
			const cosPiSur3 = Math.cos(Math.PI / 3)
			const sinPiSur3 = Math.sin(Math.PI / 3)

			const hexagon_vertices = [
				[1, 0],
				[cosPiSur3, sinPiSur3],
				[-cosPiSur3, sinPiSur3],
				[-1, 0],
				[-cosPiSur3, -sinPiSur3],
				[cosPiSur3, -sinPiSur3],
			]

			for (let hexagone_center of hexagon_vertices) {
				object = new GameObject(this.models.pilar);
				object.scale = [pilar_size / 2, pilar_height, pilar_size / 2];
				object.position = [hexagone_center[0] * this.state.width / 2, 0, hexagone_center[1] * this.state.height / 2];
				this.static_objects.push(object);
			}
		}

		pilar_size = this.state.middle_pilar[0][0] - this.state.middle_pilar[3][0];
		{
			object = new GameObject(this.models.pilar);
			object.scale = [pilar_size / 2, pilar_height, pilar_size / 2];
			object.position = [0, 0, 0];
			this.static_objects.push(object);
		}
	}

	game_loop() {
		let dynamic_objects = [];
		for (let wall of this.state.walls) {
			this.addWall(wall);
		}

		for (let ball of this.state.balls) {
			let object = new Ball(this.models.puck);
			object.position = [ball.posx, 0, ball.posy];
			object.scale = [ball.radius, ball.radius, ball.radius];
			dynamic_objects.push(object);
		}

		for (let player of this.state.players) {
			let object = new Player(this.models.paddle);
			object.position = [player.posx, 0, player.posy];
			object.scale = [player.length / 2, player.length / 5, this.state.width / 30];
			object.rotation = [0, -Math.atan2(player.right[1] - player.left[1], player.right[0] - player.left[0]), 0];
			dynamic_objects.push(object);
		}
		return dynamic_objects;
	}

	run() {
		let dynamic_objects = this.game_loop()
		this.rendering_context.clear();
		this.static_objects.forEach(object => this.rendering_context.draw_object(object));
		dynamic_objects.forEach(object => this.rendering_context.draw_object(object));
		// this.rendering_context.draw_origins();

		if (this.end)
			return;
		requestAnimationFrame(this.run.bind(this));

		//function wait(ms){
		//	var start = new Date().getTime();
		//	var end = start;
		//	while(end < start + ms) {
		//	  end = new Date().getTime();
		//	}
		//}
		// random wait to simulate a slower game
		//wait(Math.random() * 100);
	}

	async test_ping() {
		this.websocket.send("ping");
		const now = performance.now();
		while (performance.now() - now < 3000) {
			if (this.pong)
				this.pong = false;
				return true;
			await new Promise(resolve => setTimeout(resolve, 300));
		}
		console.log("ping timeout");
		this.end = true;
		return false;
	}

	async start() {
		document.getElementById("centered_box").style.display = "flex";
		const game_status = document.getElementById("game_status");
		game_status.style.display = "flex";
		const status_title = document.querySelector("#game_status h2");
		status_title.textContent = "Loading...";

		await this.load();
		let count = 0;

		console.log("Models loaded");
		while (!this.ready) {
			console.log("wait for websocket");
			if (this.end)
				return;
			await new Promise(resolve => setTimeout(resolve, 300));
		}
		count = 0;

		this.websocket.send("ready");

		status_title.textContent = "Waiting for other players";

		console.log("GameContext.start", this.state);
		while (this.state === undefined) {
			console.log("wait for state2", this.end);
			if (this.end)
				return;
			count++;
			if (count % 5 == 0) {
				if (!await this.test_ping())
					return;
			}
			await new Promise(resolve => setTimeout(resolve, 300));
		}
		count = 0;

		console.log("GameContext.start", this.state);
		this.rendering_context.scale = 1 / this.state.width
		this.rotate_view_to_me();

		while (this.state.status === "waiting_for_players") {
			let dots = "";
			for (let i = 0; i < count % 4; i++)
				dots += ".";
			status_title.textContent = "Waiting for other players" + dots;
			document.querySelector("#game_status h2").textContent = this.state.timeout + "s before force start";
			this.update_players();
			if (this.end)
				return;
			count++;
			if (count % 5 == 0) {
				if (!await this.test_ping())
					return;
			}
			await new Promise(resolve => setTimeout(resolve, 300));
		}
		count = 0;

		this.create_static_objects();

		game_status.style.display = "none";
		this.start_timer();
		this.run();
		console.log("Game LOOOOOOOOOP started");
		while (!this.end)
			await new Promise(resolve => setTimeout(resolve, 300));
		console.log("Game ended");
	}

	async update_players() {
		const players = document.getElementById("players");
		players.innerHTML = "";
		for (let player of this.state.players) {
			let li = document.createElement("li");
			li.textContent = player.username;
			li.style.color = player.ready ? "green" : "red";
			players.appendChild(li);
		}
	}

	async start_timer() {
		if (this.state.start_time === undefined || this.state.start_time === 0)
			return;
		let timer = document.getElementById("timer");
		timer.hidden = false;
		while (this.state.start_time !== undefined && this.state.start_time !== 0) {
			timer.textContent = this.state.start_time;
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		timer.hidden = true;
		document.getElementById("centered_box").style.display = "none";
	}

	addWall(wall) {
		let object = new GameObject(this.models.cube);
		object.position = [(wall[0][0] + wall[1][0]) / 2, 0, (wall[0][1] + wall[1][1]) / 2];
		object.scale = [Math.sqrt(wall[1][0] ** 2 + wall[1][1] ** 2) / 2, this.state.width / 20, this.state.width / 200];
		const vector = [wall[1][0] - wall[0][0], wall[1][1] - wall[0][1]];
		object.rotation = [0, -Math.atan2(vector[1], vector[0]), 0];
		//console.log(object.rotation[1]);
		this.static_objects.push(object);
	}

	rotate_view_to_me() {
		const players_rotation = [
			5 * Math.PI / 3,
			0,
			Math.PI / 3,
			2 * Math.PI / 3,
			Math.PI,
			4 * Math.PI / 3
		]
		console.log('this.state.player_id :>> ', this.state.player_id);
		const me_index = this.state.players.findIndex(player => player.player_id === this.state.player_id);
		console.log('me_index :>> ', me_index);
		if (me_index === -1)
			return;
		const me_arrangement = this.state.player_arrangement.findIndex(id => id === me_index);
		console.log('me_arrangement :>> ', me_arrangement);
		const rotation = players_rotation[me_arrangement];
		console.log('rotation :>> ', rotation);
		this.rendering_context.rotate_view([0, rotation, 0]);
	}
}

async function resize_canvas() {
	// @TODO resize the canvas and re-render the canvas OR print to the user to reload the page for a better experience
	//const canvas = document.querySelector('canvas');
	//canvas.width = canvas.clientWidth;
	//canvas.height = canvas.width * 0.5;
}

function keydown_event(event) {
	//console.log(event.key);
	let socket = event.currentTarget.game_socket;
	if (event.key == "ArrowLeft" || event.key == "q" || event.key == "a" || event.key == "Q" || event.key == "A") {
		//console.log("DOWN left");
		socket.send("left_pressed");
	}
	else if (event.key == "ArrowRight" || event.key == "d" || event.key == "D") {
		//console.log("DOWN right");
		socket.send("right_pressed");
	}
	else if (event.key == "Shift") {
		//console.log("DOWN turbo");
		socket.send("sprint_pressed");
	}
}

function keyup_event(event) {
	let socket = event.currentTarget.game_socket;
	if (event.key == "ArrowLeft" || event.key == "q" || event.key == "a" || event.key == "Q" || event.key == "A") {
		//console.log("UP left");
		socket.send("left_released");
	}
	else if (event.key == "ArrowRight" || event.key == "d" || event.key == "D") {
		//console.log("UP right");
		socket.send("right_released");
	}
	else if (event.key == "Shift") {
		//console.log("UP turbo");
		socket.send("sprint_released");
	}
}