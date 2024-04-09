import pygame
import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.dirname(SCRIPT_DIR))

from engine.GameEngine import GameEngine
from time import sleep

"""
state = {
    'globals':
    {
        'ARENA_WIDTH' : 600,
        'ARENA_HEIGHT' : 600,
    },
	'walls': (
		{
			'posx': 0,
			'posy': 0,
			'width': 10,
			'height': 600,
		},
		{
			'posx': 590,
			'posy': 0,
			'width': 10,
			'height': 600,
		},
		{
			'posx': 0,
			'posy': 0,
			'width': 600,
			'height': 10,
		},
		{
			'posx': 0,
			'posy': 590,
			'width': 600,
			'height': 10,
		},
    ),
	'players': [
		{
			'score': 0,
			'posx': 0,
			'posy': 0,
			'width': 10,
			'height': 10,
		},
		{
			'score': 0,
			'posx': 0,
			'posy': 0,
			'width': 10,
			'height': 10,
		},
	],
	'ball': {
		'posx': 0,
		'posy': 0,
		'radius': 10,
		'yFac
	},
}
"""
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)

FPS = 30

def render_game(state):
	ball_data = state['ball']
	ball_rect = pygame.Rect(
		ball_data['posx'] - ball_data['radius'],
		ball_data['posy'] - ball_data['radius'],
		ball_data['radius'] * 2,
		ball_data['radius'] * 2
	)

	#Draw on screen
	screen.fill(BLACK)
	for event in pygame.event.get():
		if event.type == pygame.QUIT:
			return 1
		if event.type == pygame.KEYDOWN:
			if event.key == pygame.K_ESCAPE:
				return 1
			if event.key == pygame.K_LEFT:
				engine.input('left_pressed', 0)
			if event.key == pygame.K_RIGHT:
				engine.input('right_pressed', 0)
			if event.key == pygame.K_a:
				engine.input('left_pressed', 1)
			if event.key == pygame.K_d:
				engine.input('right_pressed', 1)
		if event.type == pygame.KEYUP:
			if event.key == pygame.K_LEFT:
				engine.input('left_released', 0)
			if event.key == pygame.K_RIGHT:
				engine.input('right_released', 0)
			if event.key == pygame.K_a:
				engine.input('left_released', 1)
			if event.key == pygame.K_d:
				engine.input('right_released', 1)

	walls = state.get('walls', [])
	for wall in walls:
		pygame.draw.line(screen, WHITE,
			(wall[0][0], wall[0][1]),
			(wall[1][0], wall[1][1]),
			3
		)

	for pilar in state.get('pilars', []):
		for i in range(0, len(pilar) + 1):
			pygame.draw.line(screen, RED,
				(pilar[i%len(pilar)][0], pilar[i%len(pilar)][1]),
				(pilar[(i+1)%len(pilar)][0], pilar[(i+1)%len(pilar)][1]),
				1
			)

	players = state['players']
	for player in players:
		pygame.draw.line(screen, GREEN,
			(player['left']),
			(player['right']),
			player['width']
		)
		pygame.draw.rect(screen, RED, pygame.Rect(
			int(player['posx']),
			int(player['posy']),
			2,
			2
		))
		pygame.draw.rect(screen, WHITE, pygame.Rect(
			int(player['left'][0]),
			int(player['left'][1]),
			2,
			2
		))
		pygame.draw.rect(screen, WHITE, pygame.Rect(
			int(player['right'][0]),
			int(player['right'][1]),
			2,
			2
		))

	pygame.draw.ellipse(screen, WHITE, ball_rect)
	pygame.display.update()
	return 0

if __name__ == '__main__':
	state = {}

	engine = GameEngine(1, [0, 1], state)
	engine.start()
	engine.input('ready', 0)
	engine.input('ready', 1)
	while not engine.is_ready():
		sleep(1/30)

	pygame.init()
	screen = pygame.display.set_mode((state['width'], state['height']))
	font20 = pygame.font.Font('freesansbold.ttf', 20)
	pygame.display.set_caption("Pong")
	clock = pygame.time.Clock()

	while True:
		if render_game(state) == 1:
			break
		clock.tick(FPS)
	pygame.quit()
	engine.stop()
