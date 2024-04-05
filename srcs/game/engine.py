import math
import numpy as np
from shapely.geometry import LineString, Point
# from shapely.geometry import intersects
import threading
from xml.etree.ElementTree import PI
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from time import sleep, time

FPS = 60

PLAYER_WIDTH = 100
PLAYER_HEIGHT = 10
PLAYER_BASIC_SPEED = 150
PLAYER_RUNNING_SPEED = 150

ARENA_WIDTH = 600
ARENA_HEIGHT = 800

BALL_BASE_POSITION = (ARENA_WIDTH//2 + 100, ARENA_HEIGHT//2)
BALL_RADIUS = 10
BALL_SPEED = 150

class Player:
	def __init__(self, player_id, posx, posy):
		self.player_id = player_id
		self.posx = posx
		self.posy = posy
		self.speed = PLAYER_BASIC_SPEED
		self.score = 0
		self.inputs = {
			'left': False,
			'right': False,
			'sprint': False,
		}

	def update(self, timestamp, xFac):
		self.posx = self.posx + self.speed*xFac * timestamp

		#Contraintes de bordures
		if self.posx - PLAYER_WIDTH / 2 <= 0:
			self.posx = PLAYER_WIDTH / 2
		elif self.posx + PLAYER_WIDTH / 2 >= ARENA_WIDTH:
			self.posx = ARENA_WIDTH - PLAYER_WIDTH / 2

	def render(self):
		return {
			'posx': self.posx,
			'posy': self.posy,
			'width': PLAYER_WIDTH,
			'height': PLAYER_HEIGHT,
		}

class Ball:
	def __init__(self):
		self.position = [BALL_BASE_POSITION[0], BALL_BASE_POSITION[1]]
		self.direction = [0.894427, 0.447214]
		self.speed = BALL_SPEED
		self.just_bounced_wall = False
		self.just_bounced_players = False
		self.firstTime = 1
		self.radius = BALL_RADIUS

	def render(self):
		return {
			'posx': self.position[0],
			'posy': self.position[1],
			'radius': BALL_RADIUS,
		}

	def update(self, timestamp, players, walls):
		self.position[0] += self.direction[0] * self.speed * timestamp
		self.position[1] += self.direction[1] * self.speed * timestamp

		for wall in walls:
			if not self.has_wall_intersection(wall):
				continue
			if not self.just_bounced_wall:
				print("Intersection !")
				print("Ball : ", self.position)
				A = np.array(wall[0])
				B = np.array(wall[1])
				print("Wall : ", A, " ", B)
				wall_vect = B - A
				normal_vect =  np.array([-wall_vect[1], wall_vect[0]])
					#Check for direction of normal vector
				normal_vect = normal_vect / np.linalg.norm(normal_vect)
				dot_product = np.dot(self.direction, normal_vect)
				self.direction = self.direction - 2 * dot_product * normal_vect
					#self.direction = reflected_vect(self.direction, wall)
				if self.speed <= 500:
					self.speed *= 1.5
					print("SPEEEEEED : ", self.speed)
				self.just_bounced_wall = True
				break
			else:
				self.just_bounced_wall = False

		#Collision with players
		if any(self.has_intersection(player) for player in players.values()):
			if not self.just_bounced_players:
				self.direction[0] *= -1
				self.direction[1] *= -1
			self.just_bounced_players = True
		else:
			self.just_bounced_players = False

		#Collision with top and bottom
		if self.position[1] - BALL_RADIUS <= 0 and self.firstTime:
			self.firstTime = 0
			return 1
		elif self.position[1] >= ARENA_HEIGHT + BALL_RADIUS and self.firstTime:
			self.firstTime = 0
			return -1
		else:
			return 0

	# Used to reset the position of the ball
	# to the center of the screen
	def reset(self):
		self.position = [BALL_BASE_POSITION[0], BALL_BASE_POSITION[1]]
		self.speed = [BALL_SPEED, BALL_SPEED]
		self.firstTime = 1


	def find_distance(a,b):
		return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)

	def is_between(a,c,b):
		return Ball.find_distance(a,c) + Ball.find_distance(c,b) == Ball.find_distance(a,b)

	def has_intersection(self, player):
		return self.position[0] + BALL_RADIUS >= player.posx - PLAYER_WIDTH / 2 \
			and self.position[0] - BALL_RADIUS <= player.posx + PLAYER_WIDTH / 2 \
			and self.position[1] + BALL_RADIUS >= player.posy - PLAYER_HEIGHT / 2 \
			and self.position[1] - BALL_RADIUS <= player.posy + PLAYER_HEIGHT / 2

	def has_wall_intersection(self, wall):
		A = np.array(wall[0])
		B = np.array(wall[1])
		O = np.array(self.position)
		d = B - A
		OA = A - O

		a = np.dot(d, d)
		b = 2 * np.dot(d, OA)
		c = np.dot(OA, OA) - self.radius**2
		delta = b**2 - 4*a*c

		if delta >= 0:
			return True
		return False

		# Check if the ball is in the wall
		# line = LineString(wall)
		# # print("Line", line)
		# circle = Point(self.position[0], self.position[1])
		# # print("Circle", circle)
		# distance = circle.distance(line)
		# print("Distance", distance)

		#if Ball.is_between(self.position, wall[0], wall[1]):
		#	print("Collision!!!!!!!!!!!")

class GameEngine(threading.Thread):
	# INITIALIZATION
	def __init__(self, game_id: int, players: list, state = None) -> None:
		super().__init__()
		self.state = state
		self.players = {}
		self.create_players(players)
		self.create_walls()
		self.ball = Ball()
		self.ready = False
		self.time = time()

	def create_players(self, players: list) -> None:
		self.players = {
			players[0]['player_id']: Player(players[0]['player_id'], ARENA_WIDTH // 2, 20),
			players[1]['player_id']: Player(players[1]['player_id'], ARENA_WIDTH // 2, ARENA_HEIGHT - 20),
		}

	def create_walls(self) -> None:
		#  walls have (0, 0), (639, 479)) coordinates
		cosPiSur3 = math.cos(math.pi / 3)
		sinPiSur3 = math.sin(math.pi / 3)

		hexa_points = [
			(1, 0),
			(cosPiSur3, sinPiSur3),
			(-cosPiSur3, sinPiSur3),
			(-1, 0),
			(-cosPiSur3, -sinPiSur3),
			(cosPiSur3, -sinPiSur3),
		]

		radius = ARENA_WIDTH // 2
		wall_points = [(radius * x + ARENA_WIDTH // 2, radius * y + ARENA_HEIGHT // 2) for x, y in hexa_points]

		self.walls = [
			# 6 walls segments
			[
				wall_points[0],
				wall_points[1],
			],
			[
				wall_points[1],
				wall_points[2],
			],
			[
				wall_points[2],
				wall_points[3],
			],
			[
				wall_points[3],
				wall_points[4],
			],
			[
				wall_points[4],
				wall_points[5],
			],
			[
				wall_points[5],
				wall_points[0],
			],
		]
		print("Engine Walls")
		print(self.walls)
		self.create_corners(hexa_points, wall_points)

	def create_corners(self, hexa_points, pilar_centers) -> None:
		self.pilars = []
		r = (ARENA_WIDTH // 2) * 0.05
		for center in pilar_centers:
			self.pilars.append([(x * r + center[0], y * r + center[1]) for x, y in hexa_points])
		return

	def is_ready(self) -> bool:
		return self.ready

	# GAME LOOP
	def run(self) -> None:
		while True:
			current_time = time()
			elapsed_time = current_time - self.time
			if elapsed_time < 1 / FPS:
				sleep(1 / FPS - elapsed_time)
			self.time = current_time

			self.game_loop(elapsed_time)
			if self.state is not None:
				for key, value in self.render().items():
					self.state[key] = value
			else:
				self.broadcast_state(self.render())
			self.ready = True

	def game_loop(self, timestamp) -> None:
		for player in self.players.values():
			if player.inputs['left']:
				player.update(timestamp, -1)
			elif player.inputs['right']:
				player.update(timestamp, 1)
			if player.inputs['sprint']:
				player.speed = PLAYER_RUNNING_SPEED
			else:
				player.speed = PLAYER_BASIC_SPEED
		score = self.ball.update(timestamp, self.players, self.walls)
		if score == 1:
			self.players[0].score += 1
			self.ball.reset()
		elif score == -1:
			self.players[1].score += 1
			self.ball.reset()

	# RENDER
	def render(self) -> dict:
		return {
			'players': [player.render() for player in self.players.values()],
			'ball': self.ball.render(),
			'walls': self.walls,
			'pilars': self.pilars,
			'width': ARENA_WIDTH,
			'height': ARENA_HEIGHT,
		}

	# INPUTS
	def input(self, input_type, player_id = None) -> None:
		switcher = {
			"left_pressed": self.left_pressed,
			"left_released": self.left_released,
			"right_pressed": self.right_pressed,
			"right_released": self.right_released,
			"sprint_pressed": self.sprint_pressed,
			"sprint_released": self.sprint_released,
		}
		func = switcher.get(input_type, lambda: "Invalid input")
		if (player_id is not None):
			func(player_id)
		else:
			func()

	def left_pressed(self, player_id) -> None:
		self.players[player_id].inputs['left'] = True
		self.players[player_id].inputs['right'] = False

	def left_released(self, player_id) -> None:
		self.players[player_id].inputs['left'] = False

	def right_pressed(self, player_id) -> None:
		self.players[player_id].inputs['right'] = True
		self.players[player_id].inputs['left'] = False

	def right_released(self, player_id) -> None:
		self.players[player_id].inputs['right'] = False

	def sprint_pressed(self, player_id) -> None:
		self.players[player_id].inputs['sprint'] = True

	def sprint_released(self, player_id) -> None:
		self.players[player_id].inputs['sprint'] = False

	# BROADCAST STATE
	def broadcast_state(self, state: dict) -> None:
		state_json = state
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.send)(
			"game_consumer",
			{
				"type": "game.update",
				"game_id": state.game_id,
				"state": state_json
			}
		)
