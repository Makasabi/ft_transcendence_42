# game/consumers.py
import json

from channels.generic.websocket import SyncConsumer
from asgiref.sync import async_to_sync
from game.models import Game

from .engine.GameEngine import GameEngine

class GameConsumer(SyncConsumer):
	def __init__(self, *args, **kwargs):
		"""
		Created on demand when the first player joins.
		"""
		super().__init__(*args, **kwargs)
		self.engines = {}

	def game_start(self, event):
		game_id = event["game_id"]
		player_ids = event["players"]
		print(f"GameConsumer.game_start: {game_id}", player_ids)
		engine = GameEngine(game_id, player_ids)
		engine.start()
		self.engines[game_id] = engine

	def game_update(self, event):
		state = event["state"]
		game_id = event["game_id"]
		#print(f"GameConsumer.game_update: {game_id}", state)
		async_to_sync(self.channel_layer.group_send)(f"game_{game_id}", {
			"type": "game.update",
			"state": state
		})

	def input(self, event):
		game_id = event["game_id"]
		engine = self.engines[game_id]
		engine.input(event["player_id"], event["input"])
