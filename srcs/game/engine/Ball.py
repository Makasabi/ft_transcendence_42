import numpy as np
import random
import math

from constants import ARENA_WIDTH, ARENA_HEIGHT, BALL_SPEED, BALL_RADIUS, PLAYER_WIDTH, PLAYER_LENGTH, CENTER_X, CENTER_Y

class Ball:
	def __init__(self):
		self.reset()

	def render(self):
		return {
			'posx': self.position[0],
			'posy': self.position[1],
			'radius': BALL_RADIUS,
		}

	def update(self, timestamp, players, walls):
		self.position[0] += self.direction[0] * self.speed * timestamp
		self.position[1] += self.direction[1] * self.speed * timestamp

		for player in players.values():
			player_sides = player.get_sides()
			if not self.has_wall_intersection(player_sides):
				continue
			if not self.just_bounced_player:

				print("INTERSECTION WITH PLAYER")
				A = np.array(player_sides[0])
				B = np.array(player_sides[1])
				wall_vect = B - A
				normal_vect =  np.array([-wall_vect[1], wall_vect[0]])
				normal_vect = normal_vect / np.linalg.norm(normal_vect)
				dot_product = np.dot(self.direction, normal_vect)
				self.direction = self.direction - 2 * dot_product * normal_vect
				if self.speed <= 500:
					self.speed *= 1.2
					self.just_bounced_player = True
					break
				else:
					self.just_bounced_player = False


		for wall in walls:
			if not self.has_wall_intersection(wall):
				continue
			if not self.just_bounced_wall:
				A = np.array(wall[0])
				B = np.array(wall[1])
				wall_vect = B - A
				normal_vect =  np.array([-wall_vect[1], wall_vect[0]])
				normal_vect = normal_vect / np.linalg.norm(normal_vect)
				dot_product = np.dot(self.direction, normal_vect)
				self.direction = self.direction - 2 * dot_product * normal_vect
				if self.speed <= 500:
					self.speed *= 1.2
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
		self.position = [CENTER_X, CENTER_Y] # @TODO [0, 0]
		#self.direction = [0.894427, 0.447214]
		# random direction
		random_angle = random.uniform(0, 2 * math.pi)
		self.direction = [math.cos(random_angle), math.sin(random_angle)]

		self.speed = BALL_SPEED
		self.just_bounced_wall = False
		self.just_bounced_player = False
		self.just_bounced_players = False
		self.firstTime = 1


	def find_distance(a,b):
		return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)

	def is_between(a,c,b):
		return Ball.find_distance(a,c) + Ball.find_distance(c,b) == Ball.find_distance(a,b)

	def has_intersection(self, player):
		pass
		# return self.position[0] + BALL_RADIUS >= player.posx - PLAYER_WIDTH / 2 \
		# 	and self.position[0] - BALL_RADIUS <= player.posx + PLAYER_WIDTH / 2 \
		# 	and self.position[1] + BALL_RADIUS >= player.posy - PLAYER_LENGTH / 2 \
		# 	and self.position[1] - BALL_RADIUS <= player.posy + PLAYER_LENGTH / 2

	def has_wall_intersection(self, wall):
		A = np.array(wall[0])
		B = np.array(wall[1])
		O = np.array(self.position)
		d = B - A
		OA = A - O

		a = np.dot(d, d)
		b = 2 * np.dot(d, OA)
		c = np.dot(OA, OA) - BALL_RADIUS**2
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
