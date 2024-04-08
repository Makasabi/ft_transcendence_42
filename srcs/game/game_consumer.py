# game/consumers.py
import json

from channels.generic.websocket import AsyncConsumer
from game.models import Game

from .engine.GameEngine import GameEngine

class GameConsumer(AsyncConsumer):
	def __init__(self, *args, **kwargs):
		"""
		Created on demand when the first player joins.
		"""
		super().__init__(*args, **kwargs)
		self.engines = {}

	async def game_start(self, event):
		game_id = event["game_id"]
		player_ids = event["players"]
		#print(f"GameConsumer.game_start: {game_id}", player_ids)
		engine = GameEngine(game_id, player_ids)
		engine.start()
		self.engines[game_id] = engine

	async def game_update(self, event):
		state = event["state"]
		game_id = event["game_id"]
		#print(f"GameConsumer.game_update: {game_id}", state)
		await self.channel_layer.group_send(f"game_{game_id}", {
			"type": "game.update",
			"state": state
		})

	async def input(self, event):
		game_id = event["game_id"]
		engine = self.engines[game_id]
		engine.input(event["input"], event["player_id"])
