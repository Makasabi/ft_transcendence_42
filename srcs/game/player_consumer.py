# game/consumers.py
import json

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync

class PlayerConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		# @TODO: Verify the player is in the game
		print("PlayerConsumer.connect")
		self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
		self.group_name = f"game_{self.game_id}"
		self.group_send = f"game_engine"

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
		pass
		#content = json.loads(text_data)
		#msg_type = content["type"]
		#msg = content["msg"]
		#if msg_type == "direction":
		#	return await self.direction(msg)
		#elif msg_type == "join":
		#	return await self.join(msg)

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
