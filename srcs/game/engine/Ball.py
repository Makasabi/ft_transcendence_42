import numpy as np
import random
import math
from time import sleep

from constants import ARENA_WIDTH, ARENA_HEIGHT, BALL_SPEED, BALL_RADIUS, PLAYER_WIDTH, PLAYER_LENGTH, CENTER_X, CENTER_Y

class Ball:
	def __init__(self, debug):
		self.reset()
		self.debug = debug

	def reset(self):
		self.position = [CENTER_X, CENTER_Y]

		random_angle = random.uniform(0, 2 * math.pi)
		self.direction = [math.cos(random_angle), math.sin(random_angle)]

		self.speed = BALL_SPEED
		self.start = True

	def render(self):
		debug_info = {}
		if self.debug:
			debug_info['has_wall_collision'] = self.has_wall_collision
			debug_info['next_positions'] = self.next_positions
			debug_info['wall_collisionned'] = self.wall_collisionned
		return {
			'posx': self.position[0],
			'posy': self.position[1],
			'radius': BALL_RADIUS,
			'debug': debug_info
		}

	def update(self, timestamp, players, walls):
		if self.position[0] - BALL_RADIUS <= 0 or self.position[0] + BALL_RADIUS >= ARENA_WIDTH or self.position[1] - BALL_RADIUS <= 0 or self.position[1] + BALL_RADIUS >= ARENA_HEIGHT:
			self.reset()

		if self.debug:
			self.has_wall_collision = False
			self.next_positions = []
			self.wall_collisionned = []
		new_dir = self.direction
		next_position = None
		speed_factor = 1
		while new_dir is not None:
			next_position = [
				self.position[0] + new_dir[0] * self.speed * timestamp * speed_factor,
				self.position[1] + new_dir[1] * self.speed * timestamp * speed_factor
			]
			self.next_positions.append(next_position)

			new_dir = self.handle_walls_collisions(walls, next_position)

			if new_dir is not None:
				self.direction = new_dir
				speed_factor *= 1.1
				if self.speed <= 500:
					self.speed += 10
		self.position = next_position

		#for player in players.values():
		#	player_sides = player.get_sides()
		#	if not self.has_wall_intersection(player_sides):
		#		continue
		#	if not self.just_bounced_player:

		#		print("INTERSECTION WITH PLAYER")
		#		A = np.array(player_sides[0])
		#		B = np.array(player_sides[1])
		#		wall_vect = B - A
		#		normal_vect =  np.array([-wall_vect[1], wall_vect[0]])
		#		normal_vect = normal_vect / np.linalg.norm(normal_vect)
		#		dot_product = np.dot(self.direction, normal_vect)
		#		self.direction = self.direction - 2 * dot_product * normal_vect
		#		if self.speed <= 500:
		#			self.speed *= 1.2
		#			self.just_bounced_player = True
		#			break
		#		else:
		#			self.just_bounced_player = False

	def find_distance(a,b):
		return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)

	def is_between(a,c,b):
		return Ball.find_distance(a,c) + Ball.find_distance(c,b) == Ball.find_distance(a,b)

	def handle_walls_collisions(self, walls, next_position):
		for wall in walls:
			if has_wall_intersection(wall, next_position):
				if self.debug:
					self.has_wall_collision = True
					self.wall_collisionned.append(wall)
				A = np.array(wall[0])
				B = np.array(wall[1])
				wall_vect = B - A
				normal_vect =  np.array([-wall_vect[1], wall_vect[0]])
				normal_vect = normal_vect / np.linalg.norm(normal_vect)
				dot_product = np.dot(self.direction, normal_vect)
				return self.direction - 2 * dot_product * normal_vect
		return None

def has_wall_intersection(wall, next_position):
	segment_length = math.sqrt((wall[0][0] - wall[1][0])**2 + (wall[0][1] - wall[1][1])**2)
	return has_line_intersection(wall, next_position) and distance_segment_ball(wall, next_position) <= segment_length / 2

def has_line_intersection(line_points, ball_position):
	A = np.array(line_points[0])
	B = np.array(line_points[1])
	O = np.array(ball_position)
	d = B - A
	OA = A - O

	a = np.dot(d, d)
	b = 2 * np.dot(d, OA)
	c = np.dot(OA, OA) - BALL_RADIUS**2
	delta = b**2 - 4*a*c

	if delta >= 0:
		return True
	return False

def distance_segment_ball(line_points, ball_position):
	"""
	Compute the distance between a segment and a ball.
	params:
		line_points: [(float, float), (float, float)]
		ball_position: (float, float)
	returns:
		float
	"""
	line_middle = [(line_points[0][0] + line_points[1][0]) / 2, (line_points[0][1] + line_points[1][1]) / 2]
	ball_center_to_middle = [line_middle[0] - ball_position[0], line_middle[1] - ball_position[1]]
	ball_to_middle = list(map(lambda x: x - BALL_RADIUS, ball_center_to_middle))
	return math.sqrt(ball_to_middle[0]**2 + ball_to_middle[1]**2)
