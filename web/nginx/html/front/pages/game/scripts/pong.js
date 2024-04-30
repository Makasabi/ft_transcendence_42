import {RenderingContext} from "./rendering_context.js";
import {GameObject} from "./game_object.js";
import {Ball} from "./ball.js";
import {Player} from "./player.js";
// import { mat4 } from '/front/gl-matrix/esm/index.js';

export class GameContext {
	rendering_context;
	websocket;
	arena;
	score;
	last_time = performance.now();
	end = false;
	ready = false;
	pong = false;
	is_local = true;

	constructor(game_id) {
		this.rendering_context = new RenderingContext();
		this.static_objects = [];

		this.attribute_websocket(game_id);
		window.addEventListener("resize", resize_canvas);
	}

	destroy() {
		console.log("GameContext.destroy");
		window.removeEventListener("resize", resize_canvas);
		if (this.is_local)
		{
			document.removeEventListener("keydown", keydown_event_local);
			document.removeEventListener("keyup", keyup_event_local);
		}
		else
		{
			document.removeEventListener("keydown", keydown_event);
			document.removeEventListener("keyup", keyup_event);
		}
		this.websocket.close();
		this.end = true;
	}

	stop() {
		console.log("GameContext.stop");
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
				// console.error("Game error", data);
				game.end = true;
			}
			else if (type === "end") {
				game.ranking = data.player_ranking;
				game.score = data.score;
				game.end = true;
			}
		};
	}

	events() {
		document.game_socket = this.websocket;
		if (this.is_local)
		{
			document.addEventListener("keydown", keydown_event_local);
			document.addEventListener("keyup", keyup_event_local);
		}
		else
		{
			document.addEventListener("keydown", keydown_event);
			document.addEventListener("keyup", keyup_event);
		}
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
			this.addWall(wall, dynamic_objects);
		}

		for (let ball of this.state.balls) {
			let object = new GameObject(this.models.puck);
			object.position = [ball.posx, 0, ball.posy];
			object.scale = [ball.radius, ball.radius, ball.radius];
			dynamic_objects.push(object);
		}

		for (let player of this.state.players) {
			let object = new GameObject(this.models.paddle);
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

		if (this.is_local)
			update_lives(this.state.everyone, [1, -1, 0, -1, -1, -1]);
		else
			update_lives(this.state.everyone, arrayRotate(this.state.player_arrangement, (this.me_arrangement + 5) % 6));

		if (this.end)
			return;
		requestAnimationFrame(this.run.bind(this));
	}

	async test_ping() {
		this.websocket.send("ping");
		const now = performance.now();
		while (performance.now() - now < 3000) {
			if (this.pong)
			{
				this.pong = false;
				return true;
			}
			await new Promise(resolve => setTimeout(resolve, 300));
		}
		console.log("ping timeout");
		this.end = true;
		return false;
	}

	async start() {
		const box = document.getElementById("centered_box");
		const game_status = document.getElementById("game_status");
		const status_title = document.querySelector("#game_status h2");
		if (box === null || game_status === null || status_title === null)
			return;
		box.style.display = "flex";
		game_status.style.display = "flex";
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
		this.rendering_context.scale = 1 / this.state.width;
		console.log("players: ", this.state.players);
		if (this.state.is_local)
			this.is_local = true;
		else
			this.is_local = false;
		if (!this.is_local)
		{
			this.rotate_view_to_me();
			display_controls_remote();
			update_lives(this.state.everyone, arrayRotate(this.state.player_arrangement, (this.me_arrangement + 5) % 6));
		}
		else
		{
			this.rotate_view_local();
			display_controls_local();
			update_lives(this.state.everyone, [1, -1, 0, -1, -1, -1]);
		}
		this.events();

		while (this.state.status === "waiting_for_players") {
			let dots = "";
			for (let i = 0; i < count % 4; i++)
				dots += ".";
			status_title.textContent = "Waiting for other players" + dots;
			let game_status_title = document.getElementById("game_status_title");
			if (game_status_title !== null)
				game_status_title.textContent = this.state.timeout + "s before force start";
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
		if (players === null)
			return;
		players.innerHTML = "";
		for (let player of this.state.players) {
			console.log("player: ", player);
			if (player.username === undefined)
				continue;
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
		if (timer === null)
			return;
		timer.hidden = false;
		while (this.state.start_time !== undefined && this.state.start_time !== 0) {
			timer.textContent = this.state.start_time;
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		timer.hidden = true;
		let box = document.getElementById("centered_box");
		if (box === null)
			return;
		box.style.display = "none";
	}

	addWall(wall, dynamic_objects) {
		let object = new GameObject(this.models.cube);
		object.position = [(wall[0][0] + wall[1][0]) / 2, 0, (wall[0][1] + wall[1][1]) / 2];
		object.scale = [Math.sqrt(wall[1][0] ** 2 + wall[1][1] ** 2) / 2, this.state.width / 20, this.state.width / 200];
		const vector = [wall[1][0] - wall[0][0], wall[1][1] - wall[0][1]];
		object.rotation = [0, -Math.atan2(vector[1], vector[0]), 0];
		//console.log(object.rotation[1]);
		dynamic_objects.push(object);
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
		this.me_arrangement = this.state.player_arrangement.findIndex(id => id === me_index);
		console.log('this.me_arrangement :>> ', this.me_arrangement);
		const rotation = players_rotation[this.me_arrangement];
		console.log('rotation :>> ', rotation);
		this.rendering_context.rotate_view([0, rotation, 0]);
	}

	rotate_view_local() {
		this.rendering_context.rotate_view([0, -Math.PI / 2, 0]);
	}
}

async function resize_canvas() {
	//  resize the canvas and re-render the canvas OR print to the user to reload the page for a better experience
	// const canvas = document.getElementById("game_canvas");
	// console.log("resize_canvas", window.innerWidth, window.innerHeight, canvas.clientWidth);
	// canvas.width = window.innerWidth;
	// canvas.height = canvas.width * 0.5;
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

function keydown_event_local(event) {
	// console.log(event.key);
	let socket = event.currentTarget.game_socket;
	if (event.key == "z" || event.key == "w" || event.key == "Z" || event.key == "W") {
		socket.send("left_pressed_0");
	}
	else if (event.key == "s" || event.key == "S") {
		socket.send("right_pressed_0");
	}
	else if (event.key == "Shift") {
		socket.send("sprint_pressed_0");
	}
	else if (event.key == "ArrowDown") {
		socket.send("left_pressed_1");
	}
	else if (event.key == "ArrowUp") {
		socket.send("right_pressed_1");
	}
	else if (event.key == "0") {
		socket.send("sprint_pressed_1");
	}
}

function keyup_event_local(event) {
	let socket = event.currentTarget.game_socket;
	if (event.key == "z" || event.key == "w" || event.key == "Z" || event.key == "W") {
		socket.send("left_released_0");
	}
	else if (event.key == "s" || event.key == "S") {
		socket.send("right_released_0");
	}
	else if (event.key == "Shift") {
		socket.send("sprint_released_0");
	}
	else if (event.key == "ArrowDown") {
		socket.send("left_released_1");
	}
	else if (event.key == "ArrowUp") {
		socket.send("right_released_1");
	}
	else if (event.key == "0") {
		socket.send("sprint_released_1");
	}
}

function display_controls_local() {
	const game_footer = document.getElementById("game_footer");
	game_footer.style.paddingBottom = "1vh";
	game_footer.innerHTML = "\
	<div><h2>Left Player</h2><p>W(Z)/S/Shift</p></div>\
	<div><h2>Right Player</h2><p>Arrows(UP/DOWN)/0</p></div>"
}

function display_controls_remote() {
	const game_footer = document.getElementById("game_footer");
	game_footer.style.paddingBottom = "1vh";
	game_footer.innerHTML = "\
	<div><h2>Go left</h2><p>Q/A/left arrow</p></div>\
	<div><h2>Go right</h2><p>D/right arrow</p></div>\
	<div><h2>Go faster</h2><p>Shift</p></div>"
}

function update_lives(players, arrangement) {
	for (let i in arrangement) {
		if (arrangement[i] == -1)
			continue;
		let player = players[arrangement[i]];
		let player_infos = document.getElementById("player" + i);
		player_infos.children[0].textContent = player.username;
		player_infos.children[1].textContent = player.HP + " 💜";
	}
}

function arrayRotate(arr, num) {
	let copy = arr.slice();
	for (let i = 0; i < num; i++)
		copy.push(copy.shift());
	return copy;
  }
