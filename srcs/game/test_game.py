from engine import GameEngine
from time import sleep
import pygame

"""
state = {
    'globals':
    {
        'ARENA_WIDTH' : 600,
        'ARENA_HEIGHT' : 600,
    },
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
PLAYER_WIDTH = 100
PLAYER_HEIGHT = 10
PLAYER_BASIC_SPEED = 150
PLAYER_RUNNING_SPEED = 150

ARENA_WIDTH = 600
ARENA_HEIGHT = 800

BALL_BASE_POSITION = (ARENA_WIDTH//2 + 100, ARENA_HEIGHT//2)
BALL_RADIUS = 10
BALL_SPEED = 150
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)

pygame.init()
screen = pygame.display.set_mode((ARENA_WIDTH, ARENA_HEIGHT))
font20 = pygame.font.Font('freesansbold.ttf', 20)
pygame.display.set_caption("Pong")
clock = pygame.time.Clock()
FPS = 30

state = {}

engine = GameEngine(1, [{'player_id':0}, {'player_id':1}], state)
engine.start()
while not engine.is_ready():
	sleep(1/30)

def render_game(state):
	#print(state)
	players = state['players']
	player_rects = []
	for player in players:
		player_rects.append(pygame.Rect(
			player['posx'] - player['width']//2,
			player['posy'] - player['height']//2,
			player['width'],
			player['height']
		))
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

	for rect in player_rects:
		pygame.draw.rect(screen, GREEN, rect)
	pygame.draw.rect(screen, WHITE, ball_rect)
	pygame.display.update()
	clock.tick(FPS)
	return 0

if __name__ == '__main__':

	while True:
		if render_game(state) == 1:
			break
	pygame.quit()
