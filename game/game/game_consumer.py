# game/consumers.py
import json

from django.utils import timezone
from channels.generic.websocket import AsyncConsumer
from channels.db import database_sync_to_async
from decouple import config
import requests

from .engine.GameEngine import GameEngine
from game.models import Game, Play, LocalGame

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
		player_ranking = event["player_ranking"]
		game_score = event["score"]
		try:
			del self.engines[game_id]
		except Exception as e:
			print(f"GameConsumer.game_end: {e}")
			player_ranking = None
		await self.channel_layer.group_send(f"game_{game_id}", {
			"type": "game.end",
			"player_ranking": player_ranking,
			"score": game_score
		})
		await database_sync_to_async(create_history)(game_id, player_ranking, game_score)


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

def create_history(game_id, player_ranking, score):
	if player_ranking is None:
		game = Game.objects.get(game_id=game_id)
		game.date_end = timezone.now()
		game.end_status = "crash"
		game.ongoing = False
		game.save()
		return
	is_local = len(player_ranking) == 2 and (type(player_ranking[0]) == str or type(player_ranking[1]) == str)
	try:
		game = Game.objects.get(game_id=game_id)
		game.date_end = timezone.now()
		game.end_status = "success"
		game.ongoing = False
		game.mode = ("Local" if is_local else "Online") + game.mode
		game.save()

		if is_local:
			local_game = game.localgame
			local_game.player1_has_win = player_ranking[0] == local_game.player2_name
			local_game.score = score
			local_game.save()
			url = f"http://proxy/api/user_management/user/username/{local_game.player1_name}"
			headers = {
				'Authorization': f"App {config('APP_KEY')}"
			}
			player = requests.get(url, headers=headers)
			if player.status_code != 200:
				print(f"GameConsumer.create_history: player: {player.json()}")
				return
			player = player.json()
			if "Normal" in local_game.mode:
				Play.objects.update_or_create(
					game=local_game,
					user_id=player['id'],
					defaults={"score":int(local_game.player1_has_win)},
				)[0].save()
		else:
			for i, player_id in enumerate(player_ranking):
				play = Play.objects.update_or_create(
					game=game,
					user_id=player_id,
					defaults={"score":i},
				)[0]
				play.save()
				url = f"http://proxy/api/user_management/add_score/{player_id}/{i}"
				headers = {
					'Authorization': f"App {config('APP_KEY', default='app-insecure-qmdr&-k$vi)z$6mo%$f$td!qn_!_*-xhx864fa@qo55*c+mc&z')}"
				}
				requests.post(url, headers=headers)
	except Game.DoesNotExist as e:
		print(f"GameConsumer.create_history: {e}")
	except Game.MultipleObjectsReturned as e:
		print(f"GameConsumer.create_history: {e}")
