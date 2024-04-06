import math
import numpy as np
from shapely.geometry import LineString, Point
# from shapely.geometry import intersects
import threading
from xml.etree.ElementTree import PI
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from time import sleep, time

from Ball import Ball
from constants import ARENA_HEIGHT, ARENA_WIDTH, FPS, PLAYER_BASIC_SPEED, PLAYER_RUNNING_SPEED
from utils import get_hexagon_borders, get_hexagon_pilars, get_players_arrangement, create_player

class GameEngine(threading.Thread):
	# INITIALIZATION
	def __init__(self, game_id: int, players: list, state = None) -> None:
		super().__init__()
		self.state = state

		arena_borders = get_hexagon_borders(ARENA_WIDTH // 2)
		
		self.pilars = get_hexagon_pilars(ARENA_WIDTH // 2)

		self.walls = []
		self.players = {}
		for i, side in enumerate(get_players_arrangement(len(players))):
			if side == -1:
				self.walls.append(arena_borders[i])
			else:
				self.players[players[side]['player_id']] = create_player(players[side]['player_id'], arena_borders[i])

		self.ball = Ball()

		self.ready = False
		self.time = time()

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
