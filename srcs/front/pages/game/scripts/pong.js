import {RenderingContext} from "./rendering_context.js";
import {GameObject} from "./game_object.js";
import {Ball} from "./ball.js";
import {Player} from "./player.js";
// import { mat4 } from '/front/gl-matrix/esm/index.js';

const BALL_SIZE = 0.4;

export class GameContext {
	rendering_context;
	websocket;
	game_objects;
	arena;
	ball;
	player;
	last_time = performance.now();
	end = false;

	constructor(game_id) {
		this.rendering_context = new RenderingContext();
		this.game_objects = [];

		this.attribute_websocket(game_id);
		this.events(this);
	}

	destroy() {
		console.log("GameContext.destroy");
		this.websocket.close();
		this.end = true;
	}

	attribute_websocket(game_id) {
		this.websocket = new WebSocket(
			'ws://'
			+ window.location.host
			+ '/ws/game/'
			+ game_id,
		);

		this.websocket.onerror = function(e) {
			console.log('Game socket error:', e);
			this.end = true;
		};

		this.websocket.onopen = function() {
			console.log('Game socket open');
		};

		this.websocket.onclose = function() {
			console.log('Game socket closed unexpectedly');
			this.end = true;
		};

		let game = this;
		this.websocket.onmessage = function(e) {
			const data = JSON.parse(e.data);
			const type = data.type;
			if (type === "update") {
				game.state = data;
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
		let object;
		this.models = {};

		model_file = await fetch("/front/pages/game/models/arena.json");
		this.models.arena = await model_file.json();

		this.arena = new GameObject(model);
		this.arena.scale = [15, 15, 15];

		model_file = await fetch("/front/pages/game/models/pilar.json");
		model = await model_file.json();

		object = new GameObject(model);
		object.scale = [1.8, 0.4, 1.8];
		object.rotation = [0, Math.PI / 2, 0];
		this.game_objects.push(object);

		object = new GameObject(model);
		object.scale = [0.7, 1.2, 0.7];
		object.position = [7.5, 0, 12.9904];
		this.game_objects.push(object);

		object = new GameObject(model);
		object.scale = [0.7, 1.2, 0.7];
		object.position = [-7.5, 0, 12.9904];
		this.game_objects.push(object);

		object = new GameObject(model);
		object.scale = [0.7, 1.2, 0.7];
		object.position = [7.5, 0, -12.9904];
		this.game_objects.push(object);

		object = new GameObject(model);
		object.scale = [0.7, 1.2, 0.7];
		object.position = [-7.5, 0, -12.9904];
		this.game_objects.push(object);

		object = new GameObject(model);
		object.scale = [0.7, 1.2, 0.7];
		object.position = [15, 0, 0];
		this.game_objects.push(object);

		object = new GameObject(model);
		object.scale = [0.7, 1.2, 0.7];
		object.position = [-15, 0, 0];
		this.game_objects.push(object);

		model_file = await fetch("/front/pages/game/models/paddle.json");
		model = await model_file.json();

		object = new Player(model);
		object.rotation = [0, Math.PI, 0];
		object.position = [0, 0, 13];
		object.scale = [1, 0.5, 1];
		this.player = object;
		this.game_objects.push(object);

		model_file = await fetch("/front/pages/game/models/puck.json");
		model = await model_file.json();

		object = new Ball(model);
		object.scale = [BALL_SIZE, BALL_SIZE, BALL_SIZE];
		this.ball = object;
		this.game_objects.push(object);
	}

	game_loop() {
		//let now = performance.now();
		//let delta_time = (now - this.last_time) / 1000;
		//this.last_time = now;

		if (this.state === undefined)
			return false;
		//console.log("GameContext.state", this.state);
		this.game_objects.forEach(object => object.update(this.state));
		return true;
	}

	run() {
		if (this.game_loop())
		{
			this.rendering_context.clear();
			this.rendering_context.draw_object(this.arena);
			this.game_objects.forEach(object => this.rendering_context.draw_object(object));
			this.rendering_context.draw_origins();
		}
		else
			console.log("GameContext.state is undefined");

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
		this.run();
		while (!this.end)
			await new Promise(resolve => setTimeout(resolve, 300));
	}
}

async function resize_canvas() {
	// @TODO resize the canvas and re-render the canvas OR print to the user to reload the page for a better experience
	//const canvas = document.querySelector('canvas');
	//canvas.width = canvas.clientWidth;
	//canvas.height = canvas.width * 0.5;
}
