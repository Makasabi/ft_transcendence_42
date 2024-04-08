import math

from .constants import PLAYER_WIDTH, PLAYER_LENGTH, PLAYER_BASIC_SPEED, PLAYER_RUNNING_SPEED

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
		self.border = border
		self.debug = debug

		self.border_relative_x = 0
		border_dist = math.sqrt((border[0][0] - border[1][0]) ** 2 + (border[0][1] - border[1][1]) ** 2)
		self.left_pilar_x = -border_dist / 2
		self.right_pilar = border_dist / 2
		self.min_x = self.left_pilar_x + PLAYER_LENGTH / 2
		self.max_x = self.right_pilar - PLAYER_LENGTH / 2

		self.HP = 3
		self.inputs = {
			'left': False,
			'right': False,
			'sprint': False,
		}

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
		return self.get_real_position(self.border_relative_x)

	def get_sides(self):
		"""
		Get the left and right sides of the player.
		"""
		return (
			self.get_real_position(self.border_relative_x - PLAYER_LENGTH / 2),
			self.get_real_position(self.border_relative_x + PLAYER_LENGTH / 2)
		)

	def update(self, timestamp):
		"""
		Update the player's position based on the inputs.
		"""
		speed = PLAYER_RUNNING_SPEED if self.inputs['sprint'] else PLAYER_BASIC_SPEED
		if self.inputs['left']:
			self.border_relative_x += speed * timestamp
		if self.inputs['right']:
			self.border_relative_x -= speed * timestamp
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
		}
