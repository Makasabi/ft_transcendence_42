import {GameObject} from "./game_object.js";

const PLAYER_SPEED = 7;
const MOVING_RANGE = 5.8;

export class Player extends GameObject {
	constructor(model) {
		super(model);
	}

	update(state) {
		const player = state.player;

		//console.log("Player.update", player);
	}
}