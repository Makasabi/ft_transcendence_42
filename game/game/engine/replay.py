import pygame
import sys

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
MAGENTA = (255, 0, 255)
CYAN = (0, 255, 255)
COOL_BLUE = (87, 85, 254)

FPS = 60

def events(inputs):
	for event in pygame.event.get():
		if event.type == pygame.QUIT:
			inputs['exit'] = True
		if event.type == pygame.KEYDOWN:
			if event.key == pygame.K_LEFT:
				inputs['left'] = True
			if event.key == pygame.K_RIGHT:
				inputs['right'] = True
			if event.key == pygame.K_SPACE:
				inputs['space'] = not inputs['space']
			if event.key == pygame.K_LSHIFT:
				inputs['sprint'] = True
			if event.key == pygame.K_ESCAPE:
				inputs['exit'] = True
			if event.key == pygame.K_a:
				inputs['left_frame'] = True
			if event.key == pygame.K_d:
				inputs['right_frame'] = True
			if event.key == pygame.K_p:
				inputs['print'] = True
		if event.type == pygame.KEYUP:
			if event.key == pygame.K_LEFT:
				inputs['left'] = False
			if event.key == pygame.K_RIGHT:
				inputs['right'] = False
			if event.key == pygame.K_LSHIFT:
				inputs['sprint'] = False

def render_game(state, inputs):
	#Draw on screen
	screen.fill(BLACK)

	walls = state.get('walls', [])
	for wall in walls:
		pygame.draw.line(screen, WHITE,
			(wall[0][0], wall[0][1]),
			(wall[1][0], wall[1][1]),
			3
		)

	middle_pilar = state.get('middle_pilar', [])
	for i in range(0, len(middle_pilar) + 1):
		pygame.draw.line(screen, RED,
			(middle_pilar[i%len(middle_pilar)][0], middle_pilar[i%len(middle_pilar)][1]),
			(middle_pilar[(i+1)%len(middle_pilar)][0], middle_pilar[(i+1)%len(middle_pilar)][1]),
			1
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
		pygame.draw.rect(screen, BLUE, pygame.Rect(
			int(player['posx']),
			int(player['posy']),
			2,
			2
		))

	for collision_wall in state['collisions_walls']:
		pygame.draw.line(screen, YELLOW,
			(collision_wall[0][0], collision_wall[0][1]),
			(collision_wall[1][0], collision_wall[1][1]),
			1
		)

	balls_data = state['balls']
	balls_rect = list()
	for ball_data in balls_data:
		balls_rect.append(pygame.Rect(
			ball_data['posx'] - ball_data['radius'],
			ball_data['posy'] - ball_data['radius'],
			ball_data['radius'] * 2,
			ball_data['radius'] * 2
		))
#	ball_data = state['ball']
#	ball_rect = pygame.Rect(
#		ball_data['posx'] - ball_data['radius'],
#		ball_data['posy'] - ball_data['radius'],
#		ball_data['radius'] * 2,
#		ball_data['radius'] * 2
#	)

	for ball_data in balls_data:
		for wall in ball_data['debug'].get('wall_collisionned', []):
			pygame.draw.line(screen, COOL_BLUE,
				(int(wall[0][0]), int(wall[0][1])),
				(int(wall[1][0]), int(wall[1][1])),
				1
			)

	for ball_data in balls_data:
		if ball_data['debug'].get('has_wall_collision', False):
			color = CYAN
			for next_position in ball_data['debug'].get('next_positions', []):
				color = (0, color[1] - 10, color[2] - 10)
				if color[1] < 0 or color[2] < 0:
					color = CYAN
				pygame.draw.ellipse(screen, color, pygame.Rect(
					next_position[0] - ball_data['radius'],
					next_position[1] - ball_data['radius'],
					ball_data['radius'] * 2,
					ball_data['radius'] * 2
				))


	ball_color = MAGENTA if balls_data[0]['debug'].get('has_wall_collision', False) else WHITE
	for ball_rect in balls_rect:
		pygame.draw.ellipse(screen, WHITE, ball_rect)
	pygame.display.update()


if __name__ == '__main__':
	states = []
	args = sys.argv
	file_name = args[1] if len(args) == 2 else 'log.log'
	with open(file_name, 'r') as f:
		for line in f.readlines():
			states.append(eval(line))

	pygame.init()
	screen = pygame.display.set_mode((states[0]['width'], states[0]['height']))
	font20 = pygame.font.Font('freesansbold.ttf', 20)
	pygame.display.set_caption("Pong")
	clock = pygame.time.Clock()

	inputs = {
		'space': False,
		'sprint': False,
		'left': False,
		'right': False,
		'left_frame': False,
		'right_frame': False,
		'exit': False,
		'print': False,
	}

	i = 0
	while True:
		events(inputs)
		if inputs['exit']:
			break
		if inputs['space']:
			i = i
		if inputs['left']:
			i -= 5 * int(inputs['sprint']) + 1
		elif inputs['right'] or not inputs['space']:
			i += 5 * int(inputs['sprint']) + 1
		if inputs['left_frame']:
			i -= 1
			inputs['left_frame'] = False
		if inputs['right_frame']:
			i += 1
			inputs['right_frame'] = False
		if inputs['print']:
			print(i, states[i])
			inputs['print'] = False
		i = max(0, min(len(states) - 1, i))
		render_game(states[i], inputs)
		clock.tick(FPS)
	pygame.quit()
