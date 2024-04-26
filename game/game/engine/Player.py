import math

import requests
import numpy as np
from decouple import config

from .constants import PLAYER_HP, PLAYER_WIDTH, PLAYER_LENGTH, PLAYER_BASIC_SPEED, PLAYER_RUNNING_SPEED, CENTER_Y, CENTER_X

class Player:
	def __init__(self, player_id, border, debug):
		"""
		Player class.
		params:
			player_id: int
			border: [(float, float), (float, float)]
		returns:
			Player
		"""
		self.player_id = player_id
		self.username = get_username(player_id)
		self.border = border
		self.debug = debug
		self.ready = False

		self.border_relative_x = 0
		border_dist = math.sqrt((border[0][0] - border[1][0]) ** 2 + (border[0][1] - border[1][1]) ** 2)
		self.left_pilar_x = -border_dist / 2
		self.right_pilar = border_dist / 2
		self.min_x = self.left_pilar_x + PLAYER_LENGTH / 2
		self.max_x = self.right_pilar - PLAYER_LENGTH / 2
		self.speed_factor = 0

		self.normal = self.get_normal()

		self.HP = PLAYER_HP
		self.inputs = {
			'left': False,
			'right': False,
			'sprint': False,
		}

	def get_normal(self):
		x1, y1 = self.border[0]
		x2, y2 = self.border[1]
		x_on_border = abs((- self.left_pilar_x) / (self.right_pilar - self.left_pilar_x))
		x = x_on_border * (x2 - x1) + x1
		y = x_on_border * (y2 - y1) + y1
		hexa_center = np.array([CENTER_X, CENTER_Y])
		player_center = np.array([x, y])
		normal = hexa_center - player_center
		if normal is not None:
			normal = normal / np.linalg.norm(normal)
		return (normal[0], normal[1])

	def get_real_position(self, x):
		"""
		Get the real position of the relative x position on the border.
		params:
			x: float
		returns:
			tuple(float, float)
		"""
		x1, y1 = self.border[0]
		x2, y2 = self.border[1]
		x_on_border = abs((x - self.left_pilar_x) / (self.right_pilar - self.left_pilar_x))
		x = x_on_border * (x2 - x1) + x1
		y = x_on_border * (y2 - y1) + y1
		return (x, y)

	def get_center(self):
		"""
		Get the center of the player.
		"""
		player_center = self.get_real_position(self.border_relative_x)
		player_center = np.array(
			[player_center[0], player_center[1]]) + np.array([self.normal[0], self.normal[1]]) * (PLAYER_WIDTH / 2)
		return player_center

	def get_sides(self):
		"""
		Get the left and right sides of the player.
		"""
		sides = [
			self.get_real_position(self.border_relative_x - PLAYER_LENGTH / 2),
			self.get_real_position(self.border_relative_x + PLAYER_LENGTH / 2)
		]
		sides[0] = np.array([sides[0][0], sides[0][1]]) + np.array([self.normal[0], self.normal[1]]) * (PLAYER_WIDTH)
		sides[1] = np.array([sides[1][0], sides[1][1]]) + np.array([self.normal[0], self.normal[1]]) * (PLAYER_WIDTH)
		return [(sides[0][0], sides[0][1]), (sides[1][0], sides[1][1])]

	def update(self, timestamp):
		"""
		Update the player's position based on the inputs.
		"""
		speed = PLAYER_RUNNING_SPEED if self.inputs['sprint'] else PLAYER_BASIC_SPEED
		if ((self.inputs['left']) or (self.inputs['right'])):
			if (self.speed_factor < 2):
				self.speed_factor += 0.25
		else:
			self.speed_factor = 0
		if self.inputs['left']:
			self.border_relative_x += speed * (math.exp(self.speed_factor) + 1) * timestamp
		if self.inputs['right']:
			self.border_relative_x -= speed * (math.exp(self.speed_factor) + 1) * timestamp
		self.border_relative_x = max(self.min_x, min(self.max_x, self.border_relative_x))

	def render(self):
		"""
		Return the player's render data.
		returns:
			dict
		"""
		center = self.get_center()
		sides = self.get_sides()

		return {
			'posx': center[0],
			'posy': center[1],
			'left': sides[0],
			'right': sides[1],
			'width': PLAYER_WIDTH,
			'length': PLAYER_LENGTH,
			'normal' : self.normal,
			'HP': self.HP,
			'player_id': self.player_id,
			'username': self.username,
			'ready': self.ready,
		}

def get_username(player_id):
	"""
	Get the username of the player.
	params:
		player_id: int
	returns:
		str
	"""
	if type(player_id) == str:
		return player_id
	headers = {
		'Authorization': f"App {config('APP_KEY', default='app-insecure-qmdr&-k$vi)z$6mo%$f$td!qn_!_*-xhx864fa@qo55*c+mc&z')}"
	}
	res = requests.get(f"http://proxy/api/user_management/user/id/{player_id}", headers=headers)
	if res.status_code != 200:
		return "Unknown"
	return res.json()["username"]
