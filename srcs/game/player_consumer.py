# game/consumers.py
import json

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync

class PlayerConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		# @TODO: Verify the player is in the game
		self.code = self.scope["url_route"]["kwargs"]["code"]
		self.group_name = f"game_{self.code}"
		self.group_send = f"game_engine"

		# Join room group
		async_to_sync(self.channel_layer.group_add)(
			self.group_name, self.channel_name
		)
		self.accept()

	async def game_update(self, event):
		state = event["state"]
		await self.send(json.dumps(state))

	async def receive(self, text_data=None, bytes_data=None):
		content = json.loads(text_data)
		msg_type = content["type"]
		msg = content["msg"]
		if msg_type == "direction":
			return await self.direction(msg)
		#elif msg_type == "join":
		#	return await self.join(msg)

	async def disconnect(self, close_code):
		# Leave room group
		async_to_sync(self.channel_layer.group_discard)(
			self.group_name, self.channel_name
		)

	async def direction(self, msg: dict):
		await self.channel_layer.send(
			self.group_send,
			{
				"type": "player.direction",
				"player": self.username,
				"code": self.code,
				"direction": msg["direction"]
			},
		)



	# Receive message from room group
	#def game_message(self, event):
	#	message = event["message"]

	#	# Send message to WebSocket
	#	self.send(text_data=json.dumps({"message": message}))
