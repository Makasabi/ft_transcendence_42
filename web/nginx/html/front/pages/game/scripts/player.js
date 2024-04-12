import {GameObject} from "./game_object.js";

const PLAYER_SPEED = 7;
const MOVING_RANGE = 5.8;

export class Player extends GameObject {
	keys;

	constructor(model, keys) {
		super(model);
		this.keys = keys;
	}

	update(delta_time) {
		if (this.keys.left && !this.keys.right && this.position[0] > -MOVING_RANGE) {
			this.position[0] -= PLAYER_SPEED * delta_time * (this.keys.turbo ? 2 : 1);
		}
		if (this.keys.right && !this.keys.left && this.position[0] < MOVING_RANGE) {
			this.position[0] += PLAYER_SPEED * delta_time * (this.keys.turbo ? 2 : 1);
		}
	}
}