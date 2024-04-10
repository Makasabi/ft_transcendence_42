import {RenderingContext} from "./rendering_context.js";
import {GameObject} from "./game_object.js";
import {Ball} from "./ball.js";
import {Player} from "./player.js";
// import { mat4 } from '/front/gl-matrix/esm/index.js';

export class GameContext {
	rendering_context;
	websocket;
	arena;
	ball;
	player;
	last_time = performance.now();
	end = false;
	ready = false;

	constructor(game_id) {
		this.rendering_context = new RenderingContext();
		this.static_objects = [];

		this.attribute_websocket(game_id);
		this.events(this);
	}

	destroy() {
		console.log("GameContext.destroy");
		this.websocket.close();
		this.end = true;
	}

	attribute_websocket(game_id) {
		let game = this;
		this.websocket = new WebSocket(
			'ws://'
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
			console.log('Game socket closed unexpectedly');
			game.end = true;
		};

		this.websocket.onmessage = function(e) {
			const data = JSON.parse(e.data);
			const type = data.type;
			if (type === "update") {
				game.state = data;
			}
			else if (type === "error") {
				console.error("Game error", data);
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

		const socket = this.websocket;
		document.addEventListener("keydown", function(event) {
			//console.log(event.key);
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
		});

		document.addEventListener("keyup", function(event) {
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
		});
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

		console.log(this.state);
		{
			object = new GameObject(this.models.arena);
			object.position = [this.state.center_x, 0, this.state.center_y];
			object.scale = [this.state.width / 2, 1, this.state.height / 2];
			this.static_objects.push(object);
		}
		//{
		//	object = new GameObject(this.models.pilar);
		//	object.scale = [1.8, 0.4, 1.8];
		//	object.rotation = [0, Math.PI / 2, 0];
		//	this.static_objects.push(object);
		//}
		//{
		//	object = new GameObject(this.models.pilar);
		//	object.scale = [0.7, 1.2, 0.7];
		//	object.position = [7.5, 0, 12.9904];
		//	this.static_objects.push(object);
		//}
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

		let pilar_size = this.state.pilars[0][0][0] - this.state.pilars[0][3][0];
		let pilar_height = pilar_size/ 1.5;
		for (let hexagone_center of hexagon_vertices) {
			object = new GameObject(this.models.pilar);
			object.scale = [pilar_size / 2, pilar_height, pilar_size / 2];
			object.position = [hexagone_center[0] * this.state.width / 2, 0, hexagone_center[1] * this.state.height / 2];
			this.static_objects.push(object);
		}

		pilar_size = this.state.middle_pilar[0][0] - this.state.middle_pilar[3][0];
		{
			object = new GameObject(this.models.pilar);
			object.scale = [pilar_size / 2, pilar_height, pilar_size / 2];
			object.position = [0, 0, 0];
			this.static_objects.push(object);
		}

		for (let wall of this.state.walls) {
			this.addWall(wall);
		}
	}

	game_loop() {
		let dynamic_objects = [];
		//for (let ball of this.state.balls) {
		//	let object = new Ball(this.models.puck);
		//	object.position = [ball.x, ball.y, ball.z];
		//	object.scale = ball.radius;
		//}
		// @TODO handle multiple balls
		if (this.state.ball) {
			let object = new Ball(this.models.puck);
			object.position = [this.state.ball.posx, 0, this.state.ball.posy];
			object.scale = [this.state.ball.radius, this.state.ball.radius, this.state.ball.radius];
			dynamic_objects.push(object);
		}

		for (let player of this.state.players) {
			let object = new Player(this.models.paddle);
			object.position = [player.posx, 0, player.posy];
			object.scale = [player.length / 2, player.length / 5, this.state.width / 30];
			object.rotation = [0, -Math.atan2(player.right[1] - player.left[1], player.right[0] - player.left[0]), 0];
			dynamic_objects.push(object);
		}
		//console.log(dynamic_objects);
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

	async start() {
		await this.load();

		console.log("Models loaded");
		while (!this.ready) {
			console.log("wait for websocket");
			if (this.end)
				return;
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		this.websocket.send("ready");

		console.log("GameContext.start", this.state);
		while (this.state === undefined) {
			console.log("wait for state2", this.end);
			if (this.end)
				return;
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		console.log("GameContext.start", this.state);
		this.rendering_context.scale = 1 / this.state.width
		this.rotate_view_to_me();

		while (this.state.status !== "ongoing") {
			console.log("wait for ongoing");
			if (this.end)
				return;
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		this.create_static_objects();

		this.run();
		while (!this.end)
			await new Promise(resolve => setTimeout(resolve, 300));
	}

	addWall(wall) {
		let object = new GameObject(this.models.cube);
		object.position = [(wall[0][0] + wall[1][0]) / 2, 0, (wall[0][1] + wall[1][1]) / 2];
		object.scale = [Math.sqrt(wall[1][0] ** 2 + wall[1][1] ** 2) / 2, this.state.width / 20, this.state.width / 200];
		const vector = [wall[1][0] - wall[0][0], wall[1][1] - wall[0][1]];
		let rota;
		rota = -Math.atan2(vector[1], vector[0]);
		object.rotation = [0, rota, 0];
		console.log(object.rotation[1]);
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
