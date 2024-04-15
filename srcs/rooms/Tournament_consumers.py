from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from time import sleep
from channels.exceptions import StopConsumer
from rooms.models import Rooms, Occupy, Tournament, Round
import json
import requests


class TournamentConsumer(WebsocketConsumer):
	def connect(self):
		self.tournament_id = self.scope['url_route']['kwargs']['tournament_id']
		self.tournament_group_name = f'tournament_{self.tournament_id}'
		self.current_round = Tournament.objects.get(id=self.tournament_id).current_round
		self.round_info = Round.objects.get(tournament_id=self.tournament_id, round_number=self.current_round)
		print("round ID:", self.round_info.id)
		async_to_sync(self.channel_layer.group_add)(
			self.tournament_group_name,
			self.channel_name
		)
		self.user = self.scope['user']
		if self.user.is_anonymous or CheckPlayerAccess(self.user, self.tournament_id) == False:
			self.accept()
			self.close(3010)
		else :
			self.accept()
			url = f"http://localhost:8000/api/game/get_pool/{self.round_info.id}/{self.user.id}"
			token = f"Token {self.scope['user'].auth_token}"
			headers = {'Authorization': token}
			response = requests.get(url, headers=headers)
			self.my_pool = response.json()['game_id']

	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.tournament_group_name,
			self.channel_name
		)
		self.close(close_code)

	def receive(self, text_data):
		data = json.loads(text_data)
		if data['type'] == 'ready_to_play' :
			async_to_sync(self.channel_layer.group_send)(
				self.tournament_group_name,
				{
					'type': 'ready_to_play',
					'user_id': self.user.id
				}
			)





# Database Functions #

def CheckPlayerAccess(user, tournament):
	room_id = Tournament.objects.get(id=tournament).room_id
	if Occupy.objects.filter(player_id=user.id, room_id=room_id).exists():
		return True
	else:
		return False