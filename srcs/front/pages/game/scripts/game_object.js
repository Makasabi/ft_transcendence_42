export class GameObject {
	#position = [0, 0, 0];
	#rotation = [0, 0, 0];
	#scale = [1, 1, 1];
	model;

	constructor(model) {
		this.model = model;
	}

	update(state) {
	}

	get position() {
		return this.#position;
	}

	set position(value) {
		this.#position = value;
	}

	get rotation() {
		return this.#rotation;
	}

	set rotation(value) {
		this.#rotation = value;
	}

	get scale() {
		return this.#scale;
	}

	set scale(value) {
		this.#scale = value;
	}
}