const style = getComputedStyle(document.body);
let primary = style.getPropertyValue('--primary-color');
let secondary = style.getPropertyValue('--secondary-color');
let background = style.getPropertyValue('--dark');

particlesJS("particles-js", {
	"particles": {
		"number": {
			"value": 91,
			"density": {
				"enable": true,
				"value_area": 2725.8005034713888
			}
		},
		"color": {
			"value": primary
		},
		"shape": {
			"type": "polygon",
			"stroke": {
				"width": 0,
				"color": background
			},
			"polygon": {
				"nb_sides": 6
			},
			"image": {
				"src": "",
				"width": 100,
				"height": 100
			}
		},
		"opacity": {
			"value": 0.20844356791251797,
			"random": true,
			"anim": {
				"enable": false,
				"speed": 1,
				"opacity_min": 0.1,
				"sync": false
			}
		},
		"size": {
			"value": 63.1,
			"random": true,
			"anim": {
				"enable": false,
				"speed": 40,
				"size_min": 0.1,
				"sync": false
			}
		},
		"line_linked": {
			"enable": false,
			"distance": 150,
			"color": primary,
			"opacity": 0.4,
			"width": 1
		},
		"move": {
			"enable": true,
			"speed": 6,
			"direction": "none",
			"random": false,
			"straight": false,
			"out_mode": "out",
			"bounce": false,
			"attract": {
				"enable": false,
				"rotateX": 600,
				"rotateY": 1200
			}
		}
	},
	"interactivity": {
		"detect_on": "canvas",
		"events": {
			"onhover": {
				"enable": true,
				"mode": "grab"
			},
			"onclick": {
				"enable": true,
				"mode": "push"
			},
			"resize": true
		},
		"modes": {
			"grab": {
				"distance": 255.80432187492372,
				"line_linked": {
					"opacity": 1
				}
			},
			"bubble": {
				"distance": 207.079689136843,
				"size": 117.75119578369504,
				"duration": 2,
				"opacity": 0.23550239156739008,
				"speed": 3
			},
			"repulse": {
				"distance": 552.2125043649146,
				"duration": 0.4
			},
			"push": {
				"particles_nb": 4
			},
			"remove": {
				"particles_nb": 2
			}
		}
	},
	"retina_detect": true
});
