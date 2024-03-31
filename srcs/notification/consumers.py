import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import logging

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.group_name = 'public_room'
		await self.channel_layer.group_add(
			self.group_name,
			self.channel_name
		)
		await self.accept()
		player = self.scope['user']
		player.channel_name = self.channel_name
		print('NotificationConsumer created')

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.group_name,
			self.channel_name
		)

	async def send_notification(self, event):
		print('SEND_NOTIFICATION')
		message = event.get('message')
		logger.info(f'Sending notification: {message}')
		await self.send(text_data=json.dumps({ 'message': event['message'] }))