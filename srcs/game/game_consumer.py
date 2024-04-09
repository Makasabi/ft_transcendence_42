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
		try:
			engine = GameEngine(game_id, player_ids)
			engine.start()
		except Exception as e:
			print(f"GameConsumer.game_start: {e}")
			await self.channel_layer.group_send(f"game_{game_id}", {
				"type": "game.error",
				"error": str(e)
			})
			return
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
		engine = self.engines.get(game_id, None)
		if engine is None:
			print(f"GameConsumer.input: Engine not found for game {game_id}")
			await self.channel_layer.group_send(f"game_{game_id}", {
				"type": "game.error",
				"error": "Engine not found"
			})
			return
		engine.input(event["input"], event["player_id"])
