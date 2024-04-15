import os

import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
import json
import logging
from channels.layers import get_channel_layer
import requests


class NotificationConsumer(WebsocketConsumer):
	def connect(self):
		print('NotificationConsumer creation')
		self.group_name = 'notif_group'
		self.username = self.scope['url_route']['kwargs']['username']
		async_to_sync(self.channel_layer.group_add)(
			self.group_name,
			self.channel_name
		)
		self.accept()
		self.user = self.scope['user']
		# call api to switch user online status
		url = f"http://localhost:8000/api/user_management/switch_online/{self.username}/online"
		token = self.scope['auth']
		headers = {'Authorization': "Token" + token}
		requests.get(url, headers=headers)

		print(f'User {self.user} connected to group {self.group_name}')

	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.group_name,
			self.channel_name
		)
		url = f"http://localhost:8000/api/user_management/switch_online/{self.username}/offline"
		token = self.scope['auth']
		headers = {'Authorization': "Token" + token}
		requests.get(url, headers=headers)
		print('NotificationConsumer disconnected')

	# send targeted notification to user
	def send_notification(self, event):
		message = event.get('message')
		if (event.get('user') == self.username):
			self.send(text_data=json.dumps(event))

	def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']
		print(f'received message: {message}')
