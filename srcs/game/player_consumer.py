# game/consumers.py
import json

from channels.generic.websocket import AsyncWebsocketConsumer
from game.models import Game

class PlayerConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		print("PlayerConsumer.connect")
		self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
		if Game.objects.filter(id=self.game_id).count() == 0:
			await self.close()
		self.group_name = f"game_{self.game_id}"
		self.group_send = f"game_consumer"
		self.user = self.scope["user"]
		if self.user.is_anonymous:
			await self.close()
		# @TODO: Verify the player is in the game

		# Join room group
		await self.channel_layer.group_add(
			self.group_name, self.channel_name
		)
		await self.accept()

	async def game_update(self, event):
		state = event["state"]
		state["type"] = "update"
		print(f"PlayerConsumer.game_update: {self.game_id}", state)
		await self.send(json.dumps(state))

	async def receive(self, text_data=None, bytes_data=None):
		print("PlayerConsumer.receive")
		text_data_json = json.loads(text_data)
		await self.channel_layer.send(
			self.group_send,
			{
				"type": "input",
				"game_id": self.game_id,
				"player_id": self.user.id,
				"input": text_data_json,
			},
		)

	async def disconnect(self, close_code):
		# Leave room group
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
