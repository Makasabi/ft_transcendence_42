import threading
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from time import sleep

class GameState:
	def __init__(self, room_id, players) -> None:
		self.players = players
		self.count = 0
		self.room_id = room_id

	def update(self) -> None:
		self.count += 1

	def render(self) -> dict:
		return {
			"players": self.players,
			"count": self.count,
		}

class GameEngine(threading.Thread):
	def __init__(self) -> None:
		super().__init__()
		self.games = {}

	def run(self) -> None:
		while True:
			for room_id in self.games:
				self.games[room_id].update()
				self.broadcast_state(self.games[room_id])
			sleep(1)

	def start_game(self, room_id: int, players: list) -> None:
		if room_id in self.games:
			raise ValueError(f"Game {room_id} already exists")
		print(f"Starting game {room_id}")
		self.games[room_id] = GameState(room_id, players)

	def broadcast_state(self, state: GameState) -> None:
		state_json = state.render()
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.send)(
			"game_engine",
			{
				"type": "game.update",
				"room_id": state.room_id,
				"state": state_json
			}
		)
