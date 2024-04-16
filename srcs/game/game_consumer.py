# game/consumers.py
import json

from django.utils import timezone
from channels.generic.websocket import AsyncConsumer
from game.models import Game, Play, Player
from channels.db import database_sync_to_async

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
		self.engines[game_id].ready_to_send = True

	async def game_end(self, event):
		game_id = event["game_id"]
		del self.engines[game_id]
		player_ranking = event["player_ranking"]
		await self.channel_layer.group_send(f"game_{game_id}", {
			"type": "game.end",
			"player_ranking": player_ranking
		})
		await database_sync_to_async(create_history)(game_id, player_ranking)


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

def create_history(game_id, player_ranking):
	game = Game.objects.get(game_id=game_id)
	game.date_end = timezone.now()
	game.end_status = "success"
	game.ongoing = False

	for i, player_id in enumerate(player_ranking):
		play = Play.objects.update_or_create(
			game=game,
			user_id=player_id,
			defaults={"score":i},
		)[0]
		play.save()
		if game.visibility == "public": # @TODO PLAYER model can't be accessed here
			player = Player.objects.get(id=player_id)
			player.global_score += play.score
			player.save()
	game.save()
