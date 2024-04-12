import {GameObject} from "./game_object.js";

const BALL_SPEED = 5;

export class Ball extends GameObject {
	vx;
	vy = 0;
	vz;

	constructor(model) {
		super(model);
		this.randomize_direction();
	}

	randomize_direction() {
		const rand = Math.random();
		this.vx = BALL_SPEED * Math.cos(rand * Math.PI * 2);
		this.vy = 0;
		this.vz = BALL_SPEED * Math.sin(rand * Math.PI * 2);
	}

	is_out_of_bounds() {
		return Math.sqrt(this.position[0] ** 2 + this.position[2] ** 2) > 15;
	}

	update(delta_time) {
		if (this.position[1] < -5) {
			this.position[0] = 0;
			this.position[1] = 0;
			this.position[2] = 0;
			this.randomize_direction();
		}
		this.position[0] += this.vx * delta_time;
		this.position[1] += this.vy * delta_time;
		this.position[2] += this.vz * delta_time;

		if (this.is_out_of_bounds()) {
			this.vy -= 5 * delta_time;
			this.vx -= this.vx * delta_time * 2;
			this.vz -= this.vz * delta_time * 2;
		}
	}
}