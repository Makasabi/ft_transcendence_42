from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from time import sleep

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
			self.close()

		# checkRoomAvailability(self.room_id, self.roomMode)
		# assignMaster(self.room_id)
		# addPlayerToRoom(self.room_id)


		# Accept the connection only of there's available spots in the room (in normal mode)
		# If first player to enter - assign master role
		self.accept()
	
	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.room_group_name,
			self.channel_name
		)

		# if master leaves room, passs master to next player

	def receive(self, text_data):
		pass


def checkRoomAvailability(room_id, roomMode):
	# check if room is private
	# check if room is full
	# return True if room is available
	# return False if room is not available
	pass

def assignMaster(room_id):
	# assign master role to first player to enter room
	pass

def addPlayerToRoom(room_id):
	# add player to room
	pass