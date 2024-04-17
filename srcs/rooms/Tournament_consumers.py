from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from time import sleep
from channels.exceptions import StopConsumer
from rooms.models import Rooms, Occupy, Tournament, Round
import json
import requests
from decouple import config

from .views_tournament import update_tournament


class TournamentConsumer(WebsocketConsumer):
	def connect(self):
		self.tournament_id = self.scope['url_route']['kwargs']['tournament_id']
		self.tournament_group_name = f'tournament_{self.tournament_id}'
		self.current_round = Tournament.objects.get(id=self.tournament_id).current_round
		self.round_info = Round.objects.get(tournament_id=self.tournament_id, round_number=self.current_round)
		async_to_sync(self.channel_layer.group_add)(
			self.tournament_group_name,
			self.channel_name
		)
		self.user = self.scope['user']
		if self.user.is_anonymous or CheckPlayerAccess(self.user, self.tournament_id) == False:
			self.accept()
			self.close(3010)
		else:
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
		print("Received : ", data)
		if data['type'] == 'ready_to_play':
			round = Round.objects.get(tournament_id=self.tournament_id, round_number=self.current_round)
			if round.ready_to_play == True:
				return
			round.ready_to_play = True
			round.save()

			url = f"http://localhost:8000/api/game/start_round/{round.id}"
			headers = {
				'Authorization': f"App {config('APP_KEY', default='app-insecure-qmdr&-k$vi)z$6mo%$f$td!qn_!_*-xhx864fa@qo55*c+mc&z')}"
			}
			response = requests.get(url, headers=headers)

			if response.status_code != 200:
				self.close(3011)
				return
			async_to_sync(self.channel_layer.group_send)(
				self.tournament_group_name,
				{
					'type': 'ready_to_play',
					'user_id': self.user.id
				}
			)
		elif data['type'] == 'ping':
			update_tournament(self.tournament_id)
		elif data['type'] == 'eliminated':
			player_id = data['player_id']
			if self.user.id == player_id:
				self.close(3011)
		elif data['type'] == "tournament_finished":
			async_to_sync(self.channel_layer.group_send)(
				self.tournament_group_name,
				{
					'type': 'send_tournament_finished',
					'winner': data['winner'],
				}
			)

	def ready_to_play(self, event):
		print("Ready to play")
		self.send(text_data=json.dumps({
			"type" : "ready_to_play",
			"game_id" : self.my_pool,
		}))

	def eliminated(self, event):
		player_id = event['player_id']
		if self.user.id == player_id:
			self.close(3011)

	def round_created(self, event):
		self.send(text_data=json.dumps({
			"type": "round_created",
			"tournament_code": event['code'],
		}))

	def send_tournament_finished(self, event):
		winner = event['winner']
		self.send(text_data=json.dumps({
			"type": "tournament_finished",
			"winner": winner,
		}))

# resend event #

	def tournament_finished(self, event):
		self.send(text_data=json.dumps({
			"type": "tournament_finished",
			"winner": event['winner'],
		}))

# Database Functions #
def CheckPlayerAccess(user, tournament):
	try:
		room_id = Tournament.objects.get(id=tournament).room_id
		if Occupy.objects.filter(player_id=user.id, room_id=room_id).exists():
			return True
		return False
	except Tournament.DoesNotExist:
		return False
