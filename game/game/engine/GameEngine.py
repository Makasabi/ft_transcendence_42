import math
import numpy as np
import threading
from xml.etree.ElementTree import PI
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from time import sleep, time

from .Ball import Ball
from .Player import Player
from .constants import ARENA_HEIGHT, ARENA_WIDTH, FPS, PLAYER_BASIC_SPEED, PLAYER_RUNNING_SPEED, CENTER_X, CENTER_Y, M_PILAR_SIZE, BALL_SPAWN_TIME, MAX_BALLS
from .utils import get_hexagon_borders, get_arena_pilars, get_players_arrangement, rotate, get_middle_pilar

class GameEngine(threading.Thread):
	"""
		Initialisation des parametres du jeu
	"""
	def __init__(self, game_id: int, players: list, state = None, debug = False) -> None:
		super().__init__()
		self.debug = debug
		self.is_stop = False
		self.game_id = game_id
		self.state = state
		self.start_time = 5
		self.ready_to_send = True
		self.death_order = []

		self.is_local = len(players) == 2 and (type(players[0]) == str or type(players[1]) == str)

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
		self.everyone = []
		for id in players:
			self.everyone.append(self.players[id])

		self.collisions_walls = list(self.walls)
		for pilar in self.pilars:
			for wall in list(zip(pilar, rotate(pilar, 1))):
				self.collisions_walls.append(wall)

		self.balls = list()
		self.balls.append(Ball(self.debug))

		self.ready = False
		self.status = 'waiting_for_players'
		self.time = time()
		self.ball_time = time()

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

				if (time() - self.ball_time >= BALL_SPAWN_TIME) and (len(self.balls) < MAX_BALLS):
					print('New Ball')
					self.balls.append(Ball(self.debug))
					self.ball_time = time()

				self.is_stop = self.game_loop(elapsed_time)
				self.debug_broadcast_state(f)
				self.status = 'ongoing'

	def normal_run(self) -> None:
		self.ready = True
		self.broadcast_state(self.render())
		timeout = 100
		print('Waiting for players')
		while not self.is_ready():
			self.broadcast_state(self.waiting_for_players(timeout * 0.1))
			sleep(0.1)
			timeout -= 1
			if timeout == 0:
				self.status = 'ongoing'
		print('Game started')
		while self.start_time > 0:
			self.broadcast_state(self.render())
			sleep(1)
			self.start_time -= 1
		self.time = time()
		self.ball_time = time()
		while not self.is_stop:
			current_time = time()
			elapsed_time = current_time - self.time
			if elapsed_time < 1 / FPS:
				sleep(1 / FPS - elapsed_time)
			self.time = current_time

			if (time() - self.ball_time >= BALL_SPAWN_TIME) and (len(self.balls) < MAX_BALLS):
				self.balls.append(Ball(self.debug))
				self.ball_time = time()

			self.is_stop = self.game_loop(elapsed_time)
			self.broadcast_state(self.render())
			self.status = 'ongoing'

	"""
		Loop principale
	"""
	def run(self) -> None:
		print('GameEngine started')
		if self.debug:
			self.debug_run()
		else:
			self.normal_run()
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.send)(
			"game_consumer",
			{
				"type": "game.end",
				"game_id": self.game_id,
				"player_ranking": self.death_order,
			}
		)


	def game_loop(self, timestamp) -> None:
		for player in self.players.values():
			player.update(timestamp)
		for ball in self.balls:
			ball.update(timestamp, self.players, self.collisions_walls, self.middle_pilar, self.balls)
		for player in self.players.values():
			if player.HP <= 0:
				self.death_order.append(player.player_id)
				del self.players[player.player_id]
				self.walls.append(player.border)
				self.collisions_walls.append(player.border)
				return False
		if len(self.players) == 1:
			self.death_order.append(list(self.players.keys())[0])
			return True
		return False

	# INPUTS

	"""
		Inputs
	"""
	def input(self, input_type, player_id = None) -> None:
		if self.is_local:
			switcher = {
			"left_pressed_0": self.left_pressed,
			"left_released_0": self.left_released,
			"right_pressed_0": self.right_pressed,
			"right_released_0": self.right_released,
			"sprint_pressed_0": self.sprint_pressed,
			"sprint_released_0": self.sprint_released,
			"left_pressed_1": self.left_pressed,
			"left_released_1": self.left_released,
			"right_pressed_1": self.right_pressed,
			"right_released_1": self.right_released,
			"sprint_pressed_1": self.sprint_pressed,
			"sprint_released_1": self.sprint_released,
			"ready": self.local_ready
			}
			if "_0" in input_type:
				player_id = self.everyone[0].player_id
			else:
				player_id = self.everyone[1].player_id
		else:
			switcher = {
			"left_pressed": self.left_pressed,
			"left_released": self.left_released,
			"right_pressed": self.right_pressed,
			"right_released": self.right_released,
			"sprint_pressed": self.sprint_pressed,
			"sprint_released": self.sprint_released,
			"ready": self.player_ready
			}
		func = switcher.get(input_type, lambda x: print("Invalid input", x))
		if (player_id is not None):
			func(player_id)
		else:
			print("Error: player_id is not defined")

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

	def local_ready(self, _) -> None:
		for player in self.everyone:
			player.ready = True

	def is_ready(self) -> bool:
		if self.is_ongoing():
			return True
		for player in self.players.values():
			if not player.ready:
				return False
		return self.ready

	def is_ongoing(self) -> bool:
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
	"""
		Rendering a envoyer au front
	"""
	def render(self) -> dict:
		return {
			'status': 'ongoing',
			'players': [player.render() for player in self.players.values()],
			'everyone': [player.render() for player in self.everyone],
			'balls': [ball.render() for ball in self.balls],
			'walls': self.walls,
			'pilars': self.pilars,
			'middle_pilar': self.middle_pilar,
			'width': ARENA_WIDTH,
			'height': ARENA_HEIGHT,
			'center_x': CENTER_X,
			'center_y': CENTER_Y,
			'collisions_walls': self.collisions_walls,
			'player_arrangement': self.player_arrangement,
			'end' : self.is_stop,
			'start_time': self.start_time,
			'is_local': self.is_local,
		}

	def waiting_for_players(self, timeout) -> dict:
		return {
			'status': 'waiting_for_players',
			'players': [player.render() for player in self.players.values()],
			'everyone': [player.render() for player in self.everyone],
			'balls': [ball.render() for ball in self.balls],
			'walls': self.walls,
			'pilars': self.pilars,
			'middle_pilar': self.middle_pilar,
			'width': ARENA_WIDTH,
			'height': ARENA_HEIGHT,
			'center_x': CENTER_X,
			'center_y': CENTER_Y,
			'collisions_walls': self.collisions_walls,
			'player_arrangement': self.player_arrangement,
			'end' : self.is_stop,
			'timeout': int(timeout),
			"is_local": self.is_local,
		}
