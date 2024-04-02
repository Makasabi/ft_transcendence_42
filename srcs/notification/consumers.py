import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import logging

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		print('NotificationConsumer creation')
		self.group_name = 'notif_group'
		self.user = self.scope['url_route']['kwargs']['username']
		# print('channel_name: ', self.channel_name)
		# ADDING USER TO GROUP NOTIF_GROUP
		await self.channel_layer.group_add(
			self.group_name,
			self.channel_name
		)
		await self.accept()
		str = f'User {self.user} connected to group {self.group_name}'
		print(str)

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.group_name,
			self.channel_name
		)
		print('NotificationConsumer disconnected')

	async def send_notification(self, event):
		message = event.get('message')
		# print(f'sent message: {message}')
		await self.send(text_data=json.dumps({ 'message': event['message'] }))

	# Receive message from WebSocket
	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']
		print(f'received message: {message}')