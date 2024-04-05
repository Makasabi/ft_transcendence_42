import threading
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
		self.posx = BALL_BASE_POSITION[0]
		self.posy = BALL_BASE_POSITION[1]
		self.just_bounced_wall = False
		self.just_bounced_players = False
		self.radius = BALL_RADIUS
		self.speed = BALL_SPEED
		self.xFac = -1
		self.yFac = 1
		self.firstTime = 1

	def render(self):
		return {
			'posx': self.posx,
			'posy': self.posy,
			'radius': self.radius,
		}

	def update(self, timestamp, players):
		self.posx += self.speed*self.xFac * timestamp
		self.posy += self.speed*self.yFac * timestamp

		if self.posx - self.radius <= 0 or self.posx + self.radius >= ARENA_WIDTH:
			if not self.just_bounced_wall:
				self.xFac *= -1
			self.just_bounced_wall = True
		else:
			self.just_bounced_wall = False

		#Collision with players
		if any(self.has_intersection(player) for player in players.values()):
			if not self.just_bounced_players:
				self.yFac *= -1
			self.just_bounced_players = True
		else:
			self.just_bounced_players = False
		
		#Collision with top and bottom
		if self.posy - self.radius <= 0 and self.firstTime:
			self.firstTime = 0
			return 1
		elif self.posy >= ARENA_HEIGHT + self.radius and self.firstTime:
			self.firstTime = 0
			return -1
		else:
			return 0

	# Used to reset the position of the ball
	# to the center of the screen
	def reset(self):
		self.posx = BALL_BASE_POSITION[0]
		self.posy = BALL_BASE_POSITION[1]
		self.xFac *= -1
		self.firstTime = 1
	
	def has_intersection(self, player):
		return self.posx + self.radius >= player.posx - PLAYER_WIDTH / 2 \
			and self.posx - self.radius <= player.posx + PLAYER_WIDTH / 2 \
			and self.posy + self.radius >= player.posy - PLAYER_HEIGHT / 2 \
			and self.posy - self.radius <= player.posy + PLAYER_HEIGHT / 2

class GameEngine(threading.Thread):
	# INITIALIZATION
	def __init__(self, game_id: int, players: list, state = None) -> None:
		super().__init__()
		self.state = state
		self.players = {}
		self.create_players(players)
		self.ball = Ball()
		self.ready = False
		self.time = time()

	def create_players(self, players: list) -> None:
		self.players = {
			players[0]['player_id']: Player(players[0]['player_id'], ARENA_WIDTH // 2, 20),
			players[1]['player_id']: Player(players[1]['player_id'], ARENA_WIDTH // 2, ARENA_HEIGHT - 20),
		}

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
		score = self.ball.update(timestamp, self.players)
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
