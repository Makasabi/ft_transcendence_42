from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from time import sleep
from channels.exceptions import StopConsumer
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
		if self.user.is_anonymous:
			self.accept()
			self.close(3002)
		elif (checkRoomAvailabilityDB(self.room_id) == False):
			self.accept()
			self.close(3001)
			print(f'Room {self.room_id} is full')
		else:
			addPlayerToRoomDB(self.room_id, self.user.id)
			assignMasterDB(self.room_id, self.user.id)
			self.accept()
			self.sendAddPlayer()

	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.room_group_name,
			self.channel_name
		)
		if close_code != 3003:
			removePlayerFromRoomDB(self.room_id, self.user.id)
			new_master = reassignMasterDB(self.room_id)
			self.sendUpdatePlayer(new_master)
			self.sendRemovePlayer()
		self.close(close_code)

	def receive(self, text_data):
		data = json.loads(text_data)
		if data['type'] == 'start' or data['type'] == 'tournament_start':
			# TODO: uncomment below for production
			# if not (is_master(self.room_id, self.user.id)):
				# return
			# else:
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
		async_to_sync(self.channel_layer.group_send)(
			self.room_group_name,
			{
				'type': 'new_player',
				'player_id': self.user.id,
				'is_master': Occupy.objects.get(player_id=self.user.id, room_id=self.room_id).is_master
			}
		)
		occupy = Occupy.objects.filter(room_id=self.room_id)
		for player in occupy:
			if player.player_id != self.user.id:
				self.send(text_data=json.dumps({
					'type': 'new_player',
					'player_id': player.player_id,
					'is_master': player.is_master
				}))

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
				'player_id': self.user.id
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
		print("Username: ", self.user.username)
		if self.user.username == "val2":
			return
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
	if Rooms.objects.filter(room_id=room_id).exists():
		room = Rooms.objects.get(room_id=room_id)
		if room.roomMode == 'normal':
			if Occupy.objects.filter(room_id=room_id).count() < 6:
				return True
			else:
				return False
		elif room.roomMode == 'tournament':
			if Occupy.objects.filter(room_id=room_id).count() < 36:
				return True
			else:
				return False
	else:
		return False

def addPlayerToRoomDB(room_id, user_id):
	room = Rooms.objects.get(room_id=room_id)
	Occupy.objects.create(room_id=room, player_id=user_id)

def assignMasterDB(room_id, user_id):
	occupant = Occupy.objects.get(player_id=user_id, room_id=room_id)
	if Occupy.objects.filter(room_id=room_id).count() == 1:
		occupant.is_master = True
		occupant.save()
	else:
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
	room = Rooms.objects.get(room_id=room_id)
	try:
		occupant = Occupy.objects.get(player_id=user_id, room_id=room_id)
		occupant.delete()
	except Occupy.DoesNotExist:
		return

def is_master(room_id, user_id):
	occupant = Occupy.objects.get(player_id=user_id, room_id=room_id)
	if occupant.is_master:
		return True
	else:
		return False
