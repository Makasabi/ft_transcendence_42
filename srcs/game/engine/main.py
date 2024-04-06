import math
from GameEngine import GameEngine
from time import sleep
import pygame

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

state = {}

engine = GameEngine(1, [{'player_id':0}, {'player_id':1}], state)
engine.start()
while not engine.is_ready():
	sleep(1/30)

pygame.init()
screen = pygame.display.set_mode((state['width'], state['height']))
font20 = pygame.font.Font('freesansbold.ttf', 20)
pygame.display.set_caption("Pong")
clock = pygame.time.Clock()
FPS = 30

def render_game(state):
	#print(state)

		# player_rects.append(pygame.Rect(
		# 	player['posx'] - player['width']//2,
		# 	player['posy'] - player['height']//2,
		# 	player['width'],
		# 	player['height']
		# ))
		# player_angles.append(player['angle'])

	ball_data = state['ball']
	ball_rect = pygame.Rect(
		ball_data['posx'] - ball_data['radius'] // 2,
		ball_data['posy'] - ball_data['radius'] // 2,
		ball_data['radius'],
		ball_data['radius']
	)

	#Draw on screen
	screen.fill(BLACK)
	for event in pygame.event.get():
		if event.type == pygame.QUIT:
			return 1
		if event.type == pygame.KEYDOWN:
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

	# for rect in player_rects:
	# 	pygame.draw.rect(screen, GREEN, rect)
	# for rect, angle in zip(player_rects, player_angles):
		

	walls = state.get('walls', [])
	#print(walls)
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
			(player['positions'][0]),
			(player['positions'][1]),
			5
		)
		# print("Player", player['positions'][0], player['positions'][1])

	pygame.draw.ellipse(screen, WHITE, ball_rect)
	pygame.display.update()
	clock.tick(FPS)
	return 0

if __name__ == '__main__':

	while True:
		if render_game(state) == 1:
			break
	pygame.quit()
