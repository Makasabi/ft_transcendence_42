from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from time import sleep
import requests
from rooms.models import Rooms, Occupy
import json

class RoomConsumer(WebsocketConsumer):
	def connect(self):
		self.room_id = self.scope['url_route']['kwargs']['room_id']
		self.room_group_name = f'room_{self.room_id}'
		async_to_sync(self.channel_layer.group_add)(
			self.room_group_name,
			self.channel_name
		)
		self.user = self.scope['user']
		if self.user.get('id') == None or self.user.get('user') == None:
			self.user = None
			self.accept()
			self.close(3002)
		elif (checkRoomAvailabilityDB(self.room_id) == False):
			self.accept()
			self.close(3001)
			print(f'Room {self.room_id} is full')
		elif checkGameStarted(self.room_id):
			self.accept()
			self.close(3004)
		else:
			addPlayerToRoomDB(self.room_id, self.user['id'])
			assignMasterDB(self.room_id, self.user['id'])
			self.accept()
			self.sendAddPlayer()

	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.room_group_name,
			self.channel_name
		)
		print("Close code: ", close_code)
		if close_code != 3003 and close_code != 3002:
			removePlayerFromRoomDB(self.room_id, self.user['id'])
			new_master = reassignMasterDB(self.room_id)
			self.sendUpdatePlayer(new_master)
			self.sendRemovePlayer()
		self.close(close_code)

	def receive(self, text_data):
		try:
			data = json.loads(text_data)
		except json.JSONDecodeError:
			print('Invalid JSON')
			return
		if data['type'] == 'start' or data['type'] == 'tournament_start':
			if not (is_master(self.room_id, self.user['id'])):
				return
			else:
				if data['type'] == 'start':
					async_to_sync(self.channel_layer.group_send)(
						self.room_group_name,
						{
							'type': 'start_game',
							'game_id': data['game_id']
						}
					)
				elif data['type'] == 'tournament_start':
					async_to_sync(self.channel_layer.group_send)(
						self.room_group_name,
						{
							'type': 'start_tournament',
							'tournament_id': data['room_code']
						}
					)

# Send Events #

	def sendAddPlayer(self):
		try:
			async_to_sync(self.channel_layer.group_send)(
				self.room_group_name,
				{
					'type': 'new_player',
					'player_id': self.user['id'],
					'is_master': Occupy.objects.get(player_id=self.user['id'], room_id=self.room_id).is_master
				}
			)
			occupy = Occupy.objects.filter(room_id=self.room_id)
			for player in occupy:
				if player.player_id != self.user['id']:
					self.send(text_data=json.dumps({
						'type': 'new_player',
						'player_id': player.player_id,
						'is_master': player.is_master
					}))
		except Occupy.DoesNotExist:
			print("Player not found")
			pass
		except Occupy.MultipleObjectsReturned:
			print("Multiple players found")
			pass

	def sendUpdatePlayer(self, new_master):
		async_to_sync(self.channel_layer.group_send)(
			self.room_group_name,
			{
				'type': 'update_player',
				'player_id': new_master,
				'is_master': True
			}
		)

	def sendRemovePlayer(self):
		async_to_sync(self.channel_layer.group_send)(
			self.room_group_name,
			{
				'type': 'remove_player',
				'player_id': self.user['id']
			}
		)

# ReSend Events #

	def new_player(self, event):
		player_id = event['player_id']
		is_master = event['is_master']
		self.send(text_data=json.dumps({
			'type': 'new_player',
			'player_id': player_id,
			'is_master': is_master
		}))

	def remove_player(self, event):
		player_id = event['player_id']
		self.send(text_data=json.dumps({
			'type': 'remove_player',
			'player_id': player_id
		}))

	def update_player(self, event):
		player_id = event['player_id']
		is_master = event['is_master']
		self.send(text_data=json.dumps({
			'type': 'update_player',
			'player_id': player_id,
			'is_master': is_master
		}))

	def start_game(self, event):
		game_id = event['game_id']
		self.send(text_data=json.dumps({
			'type': 'start',
			'game_id': game_id,
		}))

	def start_tournament(self, event):
		print("Tournament id is: ", event['tournament_id'])
		tournament_id = event['tournament_id']
		self.send(text_data=json.dumps({
			'type': 'tournament_start',
			'tournament_id': tournament_id,
		}))
		self.disconnect(3003)

# Database Functions #

def checkRoomAvailabilityDB(room_id):
	try:
		room = Rooms.objects.get(room_id=room_id)
		if room.roomMode == 'Normal':
			if Occupy.objects.filter(room_id=room_id).count() < 6:
				return True
			else:
				return False
		elif room.roomMode == 'Tournament':
			if Occupy.objects.filter(room_id=room_id).count() < 36:
				return True
			else:
				return False
	except Rooms.DoesNotExist:
		return False
	except Rooms.MultipleObjectsReturned:
		return False

def addPlayerToRoomDB(room_id, user_id):
	try:
		print(f"Adding player {user_id} to room {room_id}")
		room = Rooms.objects.get(room_id=room_id)
		if Occupy.objects.filter(room_id=room_id, player_id=user_id).exists():
			occupant = Occupy.objects.get(room_id=room_id, player_id=user_id)
			occupant.delete()
		Occupy.objects.create(room_id=room, player_id=user_id)
	except Rooms.DoesNotExist:
		print("Room not found")
		pass
	except Rooms.MultipleObjectsReturned:
		print("Multiple rooms found")
		pass
	except Occupy.DoesNotExist:
		print("Occupant not found")
		pass
	except Occupy.MultipleObjectsReturned:
		print("Multiple occupants found")
		pass

def assignMasterDB(room_id, user_id):
	try:
		occupant = Occupy.objects.get(player_id=user_id, room_id=room_id)
		if Occupy.objects.filter(room_id=room_id).count() == 1:
			occupant.is_master = True
			occupant.save()
		else:
			pass
	except Occupy.DoesNotExist:
		pass
	except Occupy.MultipleObjectsReturned:
		pass

def reassignMasterDB(room_id):
	occupant = Occupy.objects.filter(room_id=room_id).first()
	if occupant:
		occupant.is_master = True
		occupant.save()
		return occupant.player_id
	else:
		pass

def removePlayerFromRoomDB(room_id, user_id):
	try:
		print(f"Removing player {user_id} from room {room_id}")
		occupant = Occupy.objects.get(player_id=user_id, room_id=room_id)
		occupant.delete()
	except Occupy.DoesNotExist:
		return

def is_master(room_id, user_id):
	try:
		occupant = Occupy.objects.get(player_id=user_id, room_id=room_id)
		if occupant.is_master:
			return True
		else:
			return False
	except Occupy.DoesNotExist:
		return False

# check if game already started
def checkGameStarted(room_id):
	url = f"http://proxy/api/game/get_game_started/{room_id}"
	started = requests.get(url)
	# print("Game started: ", started)
	return started.json()['game_started']
