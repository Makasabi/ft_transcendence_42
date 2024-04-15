from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from time import sleep
from channels.exceptions import StopConsumer
from rooms.models import Rooms, Occupy, Tournament, Round
import json

class TournamentConsumer(WebsocketConsumer):
	def connect(self):
		self.tournament_id = self.scope['url_route']['kwargs']['tournament_id']
		self.tournament_group_name = f'tournament_{self.tournament_id}'
		async_to_sync(self.channel_layer.group_add)(
			self.tournament_group_name,
			self.channel_name
		)
		self.user = self.scope['user']
		if self.user.is_anonymous:
			self.accept()
			self.close(3010)
		# check if player can be in this room.
		# elif ()
		self.accept()


	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.tournament_group_name,
			self.channel_name
		)
		self.close(close_code)

	def receive(self, text_data):
		data = json.loads(text_data)
		# if data['type'] == 'start' or data['type'] == 'tournament_start':