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
		self.code = self.scope["url_route"]["kwargs"]["code"]
		self.group_send = f"game_{self.code}"
		self.engine = GameEngine(self.group_send)
		# Runs the engine in a new thread
		self.engine.start()

	def player_new(self, event):
		self.engine.join_queue(event["player"])

	def player_direction(self, event):
		direction = event.get("direction", "UP")
		self.engine.set_player_direction(event["player"], direction)
