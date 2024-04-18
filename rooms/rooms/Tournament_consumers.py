from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from time import sleep
from rooms.models import Tournament, Round
import json
import requests
from decouple import config
from threading import Lock

from .views_tournament import update_tournament, CheckPlayerAccess

tournament_lock = Lock()

class TournamentConsumer(WebsocketConsumer):
	def connect(self):

		# Getting tournament id and group name #
		self.tournament_id = self.scope['url_route']['kwargs']['tournament_id']
		self.tournament_group_name = f'tournament_{self.tournament_id}'
		self.current_round = Tournament.objects.get(id=self.tournament_id).current_round
		self.round_info = Round.objects.get(tournament_id=self.tournament_id, round_number=self.current_round)

		# Adding user to group #
		async_to_sync(self.channel_layer.group_add)(
			self.tournament_group_name,
			self.channel_name
		)
		self.user = self.scope['user']

		# Testing user privileges on tournament #
		testAccess = CheckPlayerAccess(self.user['user']['id'], self.tournament_id)
		if (self.user.get('id') == None or self.user.get('user') == None) or testAccess == "Uninvited":
			print("💀 Uninvited or Anonymous user")
			self.user = None
			self.accept()
			self.close(3010)
		elif testAccess == "Loosed":
			print("🚨 Loosed")
			self.accept()
			self.close(3011)
		elif testAccess == False:
			print("🚩 No tournament found")
			self.accept()
			self.close(3010)
		else:
			print("🛎️ Accepted")
			self.accept()
			url = f"http://proxy/api/game/get_pool/{self.round_info.id}/{self.user['user']['id']}"
			token = f"Token {self.scope['user'].auth_token}"
			headers = {'Authorization': token}
			response = requests.get(url, headers=headers)
			self.my_pool = response.json()['game_id']

	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.tournament_group_name,
			self.channel_name
		)
		print("🪓 Disconnecting")
		self.close(close_code)

	def receive(self, text_data):
		try:
			data = json.loads(text_data)
		except json.JSONDecodeError:
			print("Invalid JSON")
			return
		print("Received : ", data)
		if data['type'] == 'ready_to_play':
			self.ready_to_play_receiver()
		elif data['type'] == 'ping':
			print("🏓 Ping - Received 🏓\nUpdating tournament")
			update_tournament(self.tournament_id)

	def ready_to_play(self, _):
		print("🎉 Ready to play 🎉")
		self.send(text_data=json.dumps({
			"type" : "ready_to_play",
			"game_id" : self.my_pool,
		}))

	def eliminated(self, event):
		print("🚨 Eliminated 🚨")
		player_id = event['player_id']
		if self.user['user']['id'] == player_id:
			self.close(3011)

	def round_created(self, event):
		print("🏅 Round created 🏅")
		self.send(text_data=json.dumps({
			"type": "round_created",
			"tournament_code": event['code'],
		}))

	def tournament_finished(self, event):
		print("🏆 Tournament finished 🏆")
		self.send(text_data=json.dumps({
			"type": "tournament_finished",
			"winner": event['winner'],
		}))

	def ready_to_play_receiver(self):
		print("🎉 Ready to play - Received 🎉")
		with tournament_lock:
			try:
				round = Round.objects.get(tournament_id=self.tournament_id, round_number=self.current_round)
			except Round.DoesNotExist:
				print("Round does not exist")
				self.close(3010)
				return
			if round.ready_to_play == True:
				return
			round.ready_to_play = True
			round.save()

		url = f"http://proxy/api/game/start_round/{round.id}"
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
				'user_id': self.user['user']['id']
			}
		)
