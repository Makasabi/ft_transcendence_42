

from constants import PLAYER_BASIC_SPEED, PLAYER_WIDTH, PLAYER_LENGTH, ARENA_WIDTH

class Player:
	def __init__(self, player_id, positions, reachs, angle):
		""" @TODO CHANGE THIS DOCSTRING
		:param player_id: int
		:param positions: {'left': (float, float), 'right': (float, float)}
		:param reachs: {'left': (float, float), 'right': (float, float)}
		:param angle: float
		"""
		
		self.player_id = player_id
		#self.posx = posx
		#self.posy = posy
		self.positions = positions
		self.angle = angle
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
			# 'posx': self.posx,
			# 'posy': self.posy,
			'positions': self.positions,
			'width': PLAYER_WIDTH,
			'height': PLAYER_LENGTH,
			'angle': self.angle,
		}
