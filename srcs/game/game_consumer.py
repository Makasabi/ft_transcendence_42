# game/consumers.py
import json

from channels.generic.websocket import SyncConsumer
from asgiref.sync import async_to_sync
from game.models import Game

from .engine import GameEngine

class GameConsumer(SyncConsumer):
	def __init__(self, *args, **kwargs):
		"""
		Created on demand when the first player joins.
		"""
		super().__init__(*args, **kwargs)
		self.engines = {}

	def game_start(self, event):
		game = Game.objects.create()
		game.save()
		game_id = game.id
		engine = GameEngine(game_id, []) # @TODO add players
		engine.start()
		self.engines[game.game_id] = engine

	def game_update(self, event):
		state = event["state"]
		game_id = event["game_id"]
		print(f"GameConsumer.game_update: {game_id}", state)
		async_to_sync(self.channel_layer.group_send)(f"game_{game_id}", {
			"type": "game.update",
			"state": state
		})
	
	def input(self, event):
		game_id = event["game_id"]
		engine = self.engines[game_id]
		engine.input(event["player_id"], event["input"])
