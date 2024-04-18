import { mat4 } from '/front/gl-matrix/esm/index.js';
//const { mat4 } = require('gl-matrix');

const vertexShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: vert

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

layout(location = 0) in vec4 aPosition;
layout(location = 1) in vec4 aColor;

out vec4 vColor;

void main() {
	  gl_Position = uProjection * uView * uModel * aPosition;
	  gl_PointSize = 10.0;
	  vColor = aColor;
}`;

const fragmentShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision highp float;

in vec4 vColor;

uniform sampler2D uSampler;

out vec4 fragColor;

void main() {
	  fragColor = vColor;
}`;

const positionAttributeLocation = 0;
const colorAttributeLocation = 1;

export class RenderingContext {
	gl;
	base_view_matrix;
	view_matrix;
	projection_matrix;
	scale = 1.0;

	constructor() {
		this.gl = this.#create_gl_context();

		this.base_view_matrix = mat4.create();
		mat4.lookAt(this.base_view_matrix, [0, 0.8, 1.5], [0, 0, 0], [0, 1, 0]); // eye, center, up
		//mat4.lookAt(this.base_view_matrix, [0, 1.1, 2.8], [0, -0.1, 0], [0, 1, 0]); // eye, center, up
		//mat4.lookAt(this.base_view_matrix, [0, 1.5, 1.7], [0, 0.7, 0.7], [0, 1, 0]); // eye, center, up

		this.view_matrix = mat4.create();
		mat4.copy(this.view_matrix, this.base_view_matrix);

		this.projection_matrix = mat4.create();
		mat4.perspective(this.projection_matrix, Math.PI / 10, this.gl.canvas.width / this.gl.canvas.height, 0.1, 20); // fov, aspect, near, far
		//mat4.perspective(this.projection_matrix, Math.PI / 5.8, this.gl.canvas.width / this.gl.canvas.height, 0.1, 50);
		//mat4.ortho(this.projection_matrix, -1.7, 1.7, -1, 1, 0.1, 50);
	}

	#create_gl_context() {
		const canvas = document.getElementById("game_canvas");
		if (!canvas) {
			throw new Error('Canvas not found');
		}
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.width * 0.5;
		let gl = canvas.getContext("webgl2", { premultipliedAlpha: false });

		if (!gl) {
			alert('Your browser does not support WebGL 2.0 ! Please upgrade to a modern browser.');
			throw new Error('WebGL2 not supported');
		}

		const program = gl.createProgram();

		const vertexShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertexShader, vertexShaderSource);
		gl.compileShader(vertexShader);
		gl.attachShader(program, vertexShader);

		const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragmentShader, fragmentShaderSource);
		gl.compileShader(fragmentShader);
		gl.attachShader(program, fragmentShader);

		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error(gl.getShaderInfoLog(vertexShader));
			console.error(gl.getShaderInfoLog(fragmentShader));
			console.error(gl.getProgramInfoLog(program));
			throw new Error('Failed to link program');
		}

		gl.useProgram(program);

		gl.enable(gl.DEPTH_TEST);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.GL_ONE_MINUS_SRC_ALPHA);

		gl.clearColor(1, 1, 1, 0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.enableVertexAttribArray(positionAttributeLocation);
		gl.enableVertexAttribArray(colorAttributeLocation);

		return gl;
	}

	rotate_view(angles) {
		let rotation_matrix = mat4.create();
		mat4.copy(rotation_matrix, this.base_view_matrix);

		mat4.rotateX(rotation_matrix, rotation_matrix, angles[0]);
		mat4.rotateY(rotation_matrix, rotation_matrix, angles[1]);
		mat4.rotateZ(this.view_matrix, rotation_matrix, angles[2]);
	}

	clear() {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	}

	draw_origins() {
		this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

		let model = mat4.create();

		mat4.scale(model, model, [this.scale, this.scale, this.scale]);

		this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), "uModel"), false, model);
		this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), "uView"), false, this.view_matrix);
		this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), "uProjection"), false, this.projection_matrix);

		let points = new Float32Array([
			0, 0, 0, 1,
			10, 0, 0, 1,
			0, 0, 0, 1,
			0, 10, 0, 1,
			0, 0, 0, 1,
			0, 0, 10, 1
		]);
		let colors = new Float32Array([
			1, 0, 0, 1,
			1, 0, 0, 1,
			0, 1, 0, 1,
			0, 1, 0, 1,
			0, 0, 1, 1,
			0, 0, 1, 1
		]);

		let positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, points, this.gl.STATIC_DRAW);

		this.gl.vertexAttribPointer(positionAttributeLocation, 4, this.gl.FLOAT, false, 4 * points.BYTES_PER_ELEMENT, 0);

		let colorBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW);

		this.gl.vertexAttribPointer(colorAttributeLocation, 4, this.gl.FLOAT, false, 4 * colors.BYTES_PER_ELEMENT, 0);

		this.gl.drawArrays(this.gl.LINES, 0, 6);

		this.gl.deleteBuffer(positionBuffer);
		this.gl.deleteBuffer(colorBuffer);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
	}

	draw_object(object) {
		let model = mat4.create();
		mat4.scale(model, model, [this.scale, this.scale, this.scale]);

		mat4.translate(model, model, object.position);
		mat4.rotateZ(model, model, object.rotation[2]);
		mat4.rotateY(model, model, object.rotation[1]);
		mat4.rotateX(model, model, object.rotation[0]);
		mat4.scale(model, model, object.scale);

		this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), "uModel"), false, model);
		this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), "uView"), false, this.view_matrix);
		this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), "uProjection"), false, this.projection_matrix);

		let positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.model.vertices), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(positionAttributeLocation, 4, this.gl.FLOAT, false, 8 * 4, 0);
		this.gl.vertexAttribPointer(colorAttributeLocation, 4, this.gl.FLOAT, false, 8 * 4, 4 * 4);

		let indexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.model.indices), this.gl.STATIC_DRAW);

		this.gl.drawElements(this.gl.TRIANGLES, object.model.indices.length, this.gl.UNSIGNED_SHORT, 0);

		this.gl.deleteBuffer(positionBuffer);
		this.gl.deleteBuffer(indexBuffer);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
	}
}