import os

import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
import json
import logging
from channels.layers import get_channel_layer


class NotificationConsumer(WebsocketConsumer):
	def connect(self):
		print('NotificationConsumer creation')
		self.group_name = 'notif_group'
		self.user = self.scope['url_route']['kwargs']['username']
		async_to_sync(self.channel_layer.group_add)(
			self.group_name,
			self.channel_name
		)
		self.accept()
		print(f'User {self.user} connected to group {self.group_name}')

	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.group_name,
			self.channel_name
		)
		print('NotificationConsumer disconnected')

	# send targeted notification to user
	def send_notification(self, event):
		message = event.get('message')
		if (event.get('user') == self.user):
			self.send(text_data=json.dumps(event))

	def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']
		print(f'received message: {message}')