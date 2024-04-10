import numpy as np
import copy
import random
import math
from time import sleep
from utils import distance_point_to_line, rotate

from constants import ARENA_WIDTH, ARENA_HEIGHT, BALL_SPEED, BALL_RADIUS, PLAYER_WIDTH, PLAYER_LENGTH, CENTER_X, CENTER_Y, M_PILAR_SIZE

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
		self.inside_m_pillar = True

	def render(self):
		debug_info = {}
		if self.debug:
			debug_info['has_wall_collision'] = self.has_wall_collision
			debug_info['next_positions'] = self.next_positions
			debug_info['wall_collisionned'] = self.wall_collisionned
			debug_info['collision_infos'] = self.collision_infos
		return {
			'posx': self.position[0],
			'posy': self.position[1],
			'radius': BALL_RADIUS,
			'debug': debug_info
		}

	"""
		Update de la position de la balle
	"""
	def update(self, timestamp, players, walls, middle_pilar, balls):
		if self.position[0] - BALL_RADIUS <= 0 or self.position[0] + BALL_RADIUS >= ARENA_WIDTH or self.position[1] - BALL_RADIUS <= 0 or self.position[1] + BALL_RADIUS >= ARENA_HEIGHT:
			self.reset()

		if self.debug:
			self.has_wall_collision = False
			self.next_positions = []
			self.wall_collisionned = []
			self.collision_infos = []
		new_dir = self.direction
		next_position = None
		speed_factor = 1
		is_collision = False
		while new_dir is not None:
			next_position = [
				self.position[0] + new_dir[0] * self.speed * timestamp * speed_factor,
				self.position[1] + new_dir[1] * self.speed * timestamp * speed_factor
			]
			self.next_positions.append(next_position)

			new_dir = self.handle_walls_collisions(walls, middle_pilar, next_position)

			if new_dir is None:
				new_dir = self.handle_player_collisions(players, next_position)

			if new_dir is None:
				new_dir = self.handle_ball_collisions(balls, next_position)

			if (new_dir is None) and (self.handle_player_border(players, next_position)):
				self.reset()
				return

			if new_dir is not None:
				is_collision = True
				new_dir = new_dir / np.linalg.norm(new_dir)
				self.direction = new_dir
				speed_factor *= 1.1
		if self.speed <= 500 and is_collision:
			self.speed += 10
		self.position = next_position

	"""
		Gestion des collisions
	"""
	def handle_ball_collisions(self, balls, next_position):
		for ball in balls:
			if self is ball:
				continue
			A = np.array(next_position)
			B = np.array(ball.position)
			AB = B - A;
			distance = np.linalg.norm(AB)
			if distance <= BALL_RADIUS * 2:
				return [AB[0], AB[1]]
		return None

	def handle_wall_redirection(self, wall):
		A = np.array(wall[0])
		B = np.array(wall[1])
		wall_vect = B - A
		normal_vect =  np.array([-wall_vect[1], wall_vect[0]])
		normal_vect = normal_vect / np.linalg.norm(normal_vect)
		dot_product = np.dot(self.direction, normal_vect)
		return self.direction - 2 * dot_product * normal_vect

	def handle_walls_collisions(self, walls, middle_pilar, next_position):
		tmp = list(copy.copy(walls))
		if not self.is_inside_m_pilar(middle_pilar) or self.inside_m_pillar == False:
			for wall in list(zip(middle_pilar, rotate(middle_pilar, 1))):
				tmp.append(wall)
			self.inside_m_pillar = False
		for wall in tmp:
			wall = tuple(wall)
			if self.has_wall_intersection(wall, next_position):
				if self.debug:
					self.has_wall_collision = True
					self.wall_collisionned.append(wall)
				return self.handle_wall_redirection(wall)
		return None

	def handle_player_collisions(self, players, next_position):
		for i in players:
			player = players[i]
			if self.has_wall_intersection(player.get_sides(), next_position):
				print("Collision with player")
				if self.debug:
					self.has_wall_collision = True
					self.wall_collisionned.append(player.get_sides())
				P = np.array(player.get_center())
				O = np.array(next_position)
				new_direction = O - P
				return [new_direction[0], new_direction[1]]
		return None

	def handle_player_border(self, players, next_position):
		for i in players:
			player = players[i]
			A = np.array(player.border[0])
			B = np.array(player.border[1])
			O = np.array(next_position)
			d = B - A
			OA = O - A
			if (np.cross(d, OA) < 0):
				player.HP -= 1
				print("Player ", player.player_id, " still has ", player.HP, " points.")
				return True
		return False

	"""
		Utilities
	"""
	def has_wall_intersection(self, line_points, ball_position):
		A = np.array(line_points[0])
		B = np.array(line_points[1])
		O = np.array(ball_position)
		d = B - A
		OA = A - O

		a = np.dot(d, d)
		b = 2 * np.dot(d, OA)
		c = np.dot(OA, OA) - BALL_RADIUS**2
		delta = b**2 - 4*a*c

		if delta < 0:
			return False
		t = [(-b + math.sqrt(delta)) / (2 * a), (-b - math.sqrt(delta)) / (2 * a)]
		d_norm = np.linalg.norm(d)
		if (t[0] > 0 and t[0] < 1) or (t[1] > 0 and t[1] < 1):
			return True
		return False

	def is_inside_m_pilar(self, m_pilar):
		for i in range(len(m_pilar)):
			distance = distance_point_to_line(self.position, m_pilar[i], m_pilar[(i+1)%len(m_pilar)])
			if distance > M_PILAR_SIZE * 2:
				return False
		return True
