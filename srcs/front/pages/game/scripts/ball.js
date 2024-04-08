import {GameObject} from "./game_object.js";

const BALL_SPEED = 5;

export class Ball extends GameObject {
	vx;
	vy = 0;
	vz;

	constructor(model) {
		super(model);
	}

	//is_out_of_bounds() {
	//	return Math.sqrt(this.position[0] ** 2 + this.position[2] ** 2) > 15;
	//}

	update(state) {
		const ball = state.ball;
		//console.log("Ball.update", ball);

		//if (this.is_out_of_bounds()) {
		//	this.vy -= 5 * delta_time;
		//	this.vx -= this.vx * delta_time * 2;
		//	this.vz -= this.vz * delta_time * 2;
		//}
	}
}