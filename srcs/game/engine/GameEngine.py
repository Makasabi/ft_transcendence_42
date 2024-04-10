import math
import numpy as np
import threading
from xml.etree.ElementTree import PI
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from time import sleep, time

from .Ball import Ball
from .Player import Player
from .constants import ARENA_HEIGHT, ARENA_WIDTH, FPS, PLAYER_BASIC_SPEED, PLAYER_RUNNING_SPEED, CENTER_X, CENTER_Y, M_PILAR_SIZE
from .utils import get_hexagon_borders, get_arena_pilars, get_players_arrangement, rotate, get_middle_pilar

class GameEngine(threading.Thread):
	# INITIALIZATION
	def __init__(self, game_id: int, players: list, state = None) -> None:
		super().__init__()
		if state is None:
			self.debug = False
		else:
			self.debug = True
		self.is_stop = False
		self.game_id = game_id
		self.state = state
		self.ready_to_send = True

		arena_borders = get_hexagon_borders(ARENA_WIDTH // 2)

		self.pilars = get_arena_pilars(ARENA_WIDTH // 2)
		self.middle_pilar = get_middle_pilar(M_PILAR_SIZE)

		self.walls = []
		self.players = {}
		self.player_arrangement = get_players_arrangement(len(players))
		for i, side in enumerate(self.player_arrangement):
			if side == -1:
				self.walls.append(arena_borders[i])
			else:
				self.players[players[side]] = Player(players[side], arena_borders[i], self.debug)

		self.collisions_walls = list(self.walls)
		for pilar in self.pilars:
			for wall in list(zip(pilar, rotate(pilar, 1))):
				self.collisions_walls.append(wall)

		self.ball = Ball(self.debug)

		self.ready = False
		self.status = 'waiting_for_players'
		self.time = time()

	def stop(self) -> None:
		self.is_stop = True

	# GAME LOOP
	def debug_run(self) -> None:
		with open('log.log', 'w') as f:
			self.ready = True
			self.debug_broadcast_state(f)
			while not self.is_ready():
				sleep(0.1)
			while not self.is_stop:
				current_time = time()
				elapsed_time = current_time - self.time
				if elapsed_time < 1 / FPS:
					sleep(1 / FPS - elapsed_time)
				self.time = current_time

				self.is_stop = self.game_loop(elapsed_time)
				self.debug_broadcast_state(f)
				self.status = 'ongoing'

	def normal_run(self) -> None:
		self.ready = True
		self.broadcast_state(self.render())
		while not self.is_ready():
			sleep(0.3)
		while not self.is_stop:
			current_time = time()
			elapsed_time = current_time - self.time
			if elapsed_time < 1 / FPS:
				sleep(1 / FPS - elapsed_time)
			self.time = current_time

			self.is_stop = self.game_loop(elapsed_time)
			self.broadcast_state(self.render())
			self.status = 'ongoing'

	def run(self) -> None:
		if self.debug:
			self.debug_run()
			return
		self.normal_run()

	def game_loop(self, timestamp) -> None:
		for player in self.players.values():
			player.update(timestamp)
		self.ball.update(1 / 60, self.players, self.collisions_walls, self.middle_pilar)
		for player in self.players.values():
			if player.HP <= 0:
				self.players.pop(player.player_id)
				self.walls.append(player.border)
				self.collisions_walls.append(player.border)
				return False
		if len(self.players) <= 1:
			return True
		return False

	# INPUTS
	def input(self, input_type, player_id = None) -> None:
		switcher = {
			"left_pressed": self.left_pressed,
			"left_released": self.left_released,
			"right_pressed": self.right_pressed,
			"right_released": self.right_released,
			"sprint_pressed": self.sprint_pressed,
			"sprint_released": self.sprint_released,
			"ready": self.player_ready
		}
		func = switcher.get(input_type, lambda: "Invalid input")
		if (player_id is not None):
			func(player_id)
		else:
			func()

	def left_pressed(self, player_id) -> None:
		if player_id in self.players:
			self.players[player_id].inputs['left'] = True
			self.players[player_id].inputs['right'] = False

	def left_released(self, player_id) -> None:
		if player_id in self.players:
			self.players[player_id].inputs['left'] = False

	def right_pressed(self, player_id) -> None:
		if player_id in self.players:
			self.players[player_id].inputs['right'] = True
			self.players[player_id].inputs['left'] = False

	def right_released(self, player_id) -> None:
		if player_id in self.players:
			self.players[player_id].inputs['right'] = False

	def sprint_pressed(self, player_id) -> None:
		if player_id in self.players:
			self.players[player_id].inputs['sprint'] = True

	def sprint_released(self, player_id) -> None:
		if player_id in self.players:
			self.players[player_id].inputs['sprint'] = False

	def player_ready(self, player_id) -> None:
		self.players[player_id].ready = True

	def is_ready(self) -> bool:
		for player in self.players.values():
			if not player.ready:
				return False
		return self.ready

	def is_ongoin(self) -> bool:
		return self.status == 'ongoing'

	# BROADCAST STATE
	def broadcast_state(self, state: dict) -> None:
		if not self.ready_to_send:
			return
		state_json = state
		channel_layer = get_channel_layer()
		self.ready_to_send = False
		async_to_sync(channel_layer.send)(
			"game_consumer",
			{
				"type": "game.update",
				"game_id": self.game_id,
				"state": state_json,
			}
		)

	def debug_broadcast_state(self, file) -> None:
		for key, value in self.render().items():
			self.state[key] = value
		file.write(str(self.state) + '\n')

	# RENDER
	def render(self) -> dict:
		return {
			'status': 'ongoing',
			'players': [player.render() for player in self.players.values()],
			'ball': self.ball.render(),
			'walls': self.walls,
			'pilars': self.pilars,
			'middle_pilar': self.middle_pilar,
			'width': ARENA_WIDTH,
			'height': ARENA_HEIGHT,
			'center_x': CENTER_X,
			'center_y': CENTER_Y,
			'collisions_walls': self.collisions_walls,
			'player_arrangement': self.player_arrangement,
			'end' : self.is_stop
		}
