# game/consumers.py
import json

from channels.generic.websocket import AsyncWebsocketConsumer
from game.models import Game, Play
from channels.db import database_sync_to_async

class PlayerConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
		def check_game_id(game_id):
			return Game.objects.filter(game_id=game_id).count()
		if await database_sync_to_async(check_game_id)(self.game_id) == 0:
			return
		self.group_name = f"game_{self.game_id}"
		self.group_send = f"game_consumer"
		self.user = self.scope["user"]
		if self.user.get("id") is None or self.user.get("user") is None:
			return
		if not database_sync_to_async(user_is_in_game)(self.game_id, self.user["id"]): # @TODO VERIF
			return

		# Join room group
		await self.channel_layer.group_add(
			self.group_name, self.channel_name
		)
		await self.accept()

	async def game_update(self, event):
		state = event["state"]
		state["type"] = "update"
		state["player_id"] = self.user['id']
		await self.send(json.dumps(state))

	async def game_error(self, event):
		error = event["error"]
		await self.send(json.dumps({"type": "error", "error": error}))

		self.close(4000)

	async def game_end(self, event):
		await self.send(json.dumps({
				"type": "end",
				"player_ranking": event["player_ranking"],
				"score": event["score"],
		}))

	async def receive(self, text_data=None, bytes_data=None):
		if text_data is None:
			return
		if text_data == "ping":
			await self.send("pong")
			return
		await self.channel_layer.send(
			self.group_send,
			{
				"type": "input",
				"game_id": self.game_id,
				"player_id": self.user['id'],
				"input": text_data,
			},
		)

	async def disconnect(self, close_code):
		# Leave room group
		if not hasattr(self, "group_name"):
			return
		await self.channel_layer.group_discard(
			self.group_name, self.channel_name
		)

	#async def direction(self, msg: dict):
	#	await self.channel_layer.send(
	#		self.group_send,
	#		{
	#			"type": "player.direction",
	#			"player": self.username,
	#			"code": self.code,
	#			"direction": msg["direction"]
	#		},
	#	)


	# Receive message from room group
	#def game_message(self, event):
	#	message = event["message"]

	#	# Send message to WebSocket
	#	self.send(text_data=json.dumps({"message": message}))

def user_is_in_game(game_id, user_id):
	plays = Play.objects.filter(game_id=game_id)
	for play in plays:
		if play.user_id == user_id:
			return True
	return False
