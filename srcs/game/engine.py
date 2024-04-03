import threading
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .engine import GameState

class GameState:
	def __init__(self) -> None:
		self.players = []
		self.board = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
		self.winner = None

	def render(self) -> dict:
		return {
			"players": self.players,
			"board": self.board,
			"winner": self.winner,
		}

class GameEngine(threading.Thread):
	def __init__(self, group_name: str) -> None:
		super().__init__()
		self.group_name = group_name

	def run(self) -> None:
		pass

	def broadcast_state(self, state: GameState) -> None:
		state_json = state.render()
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			self.group_name, {"type": "game_update", "state": state_json}
		)

