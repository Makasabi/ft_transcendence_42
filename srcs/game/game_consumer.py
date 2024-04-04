# game/consumers.py
import json

from channels.generic.websocket import SyncConsumer

from .engine import GameEngine

class GameConsumer(SyncConsumer):
	def __init__(self, *args, **kwargs):
		"""
		Created on demand when the first player joins.
		"""
		super().__init__(*args, **kwargs)
		print("GameConsumer.__init__")
		self.engine = GameEngine()
		self.engine.start()

	def game_start(self, event):
		try:
			self.engine.start_game(event["room_id"])
		except ValueError as e:
			print(e)

	def game_update(self, event):
		state = event["state"]
		room_id = event["room_id"]
		print(f"GameConsumer.game_update: {room_id}", state)
		self.channel_layer.group_send(f"game_{room_id}", {
			"type": "game.update",
			"state": state
		})



	#def player_new(self, event):
	#	self.engine.join_queue(event["player"])

	#def player_direction(self, event):
	#	direction = event.get("direction", "UP")
	#	self.engine.set_player_direction(event["player"], direction)
