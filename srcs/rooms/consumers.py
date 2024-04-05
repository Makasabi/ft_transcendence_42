from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from time import sleep
from channels.exceptions import StopConsumer
from rooms.models import Rooms, Occupy
import json
import channels.exceptions

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
		elif (checkRoomAvailability(self.room_id) == False):
			self.accept()
			self.close(3001)
			print(f'Room {self.room_id} is full')
		else:
			addPlayerToRoom(self.room_id, self.user.id)
			assignMaster(self.room_id, self.user.id)
			self.accept()
			self.sendAddPlayer()

		# Accept the connection only of there's available spots in the room (in normal mode)
		# If first player to enter - assign master role

	def disconnect(self, close_code):
		if Rooms.objects.filter(room_id=self.room_id).exists():
			print (f'user id is {self.user.id} room id is {self.room_id}')
			if Occupy.objects.filter(player_id=self.user.id, room_id=self.room_id).exists():
				occupant = Occupy.objects.get(player_id=self.user.id, room_id=self.room_id)
				occupant.delete()
		async_to_sync(self.channel_layer.group_discard)(
			self.room_group_name,
			self.channel_name
		)
		self.sendRemovePlayer()
		self.close(close_code)
		
		# if player leaves room, remove player from occupy table
		# if master leaves room, passs master to next player
		# if last player leaves room, delete room_code

	def receive(self, text_data):
		pass

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


	def sendRemovePlayer(self):
		async_to_sync(self.channel_layer.group_send)(
			self.room_group_name,
			{
				'type': 'remove_player',
				'player_id': self.user.id
			}
		)

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


def checkRoomAvailability(room_id):
	if Rooms.objects.filter(room_id=room_id).exists():
		room = Rooms.objects.get(room_id=room_id)
		if room.roomMode == 'normal':
			count = Occupy.objects.filter(room_id=room_id).count()
			print(f'Room {room_id} has {count} players')
			if count < 6:
				return True
			else:
				return False
		elif room.roomMode == 'tournament':
			return True
	else:
		return False

def addPlayerToRoom(room_id, user_id):
	print(f"User_id is {user_id} Room_id is {room_id}")
	room = Rooms.objects.get(room_id=room_id)
	Occupy.objects.create(room_id=room, player_id=user_id)

def assignMaster(room_id, user_id):
	room = Rooms.objects.get(room_id=room_id)
	occupant = Occupy.objects.get(player_id=user_id, room_id=room_id)
	if Occupy.objects.filter(room_id=room_id).count() == 1:
		occupant.is_master = True
		occupant.save()
	else:
		pass