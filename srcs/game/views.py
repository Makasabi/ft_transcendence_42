from django.http import JsonResponse
from channels.layers import get_channel_layer
from rest_framework.decorators import api_view
from asgiref.sync import async_to_sync
from game.models import Game, Play
from user_management.models import Player
from django.db.models import Count


# Create your views here.
def index(request):
	"""
	Return the first game information in the database

	json response format:
	{
		game: "game"
	}
	"""
	return JsonResponse({
		"game": "game"
	})


@api_view(["POST"])
def start(request, room_id):
	"""
	Start the game with the given room_id

	json response format:
	{
		game: "game",
		room_id: room_id
	}
	"""
	body = request.data
	print(body)
	async_to_sync(get_channel_layer().send)(
		"game_engine",
		{
			"type": "game.start",
			"room_id": room_id
		}
	)
	return JsonResponse({
		"game": "game",
		"room_id": room_id
	})

@api_view(["GET"])
def get_players(request, game_id):
	"""
	Return the list of players in the room with the given room_id

	json response format:
	{
		players: ["player1", "player2", ...]
	}
	"""
	# retrieve players from Play DB
	print("players for", game_id)

	players = Player.objects.filter(play__game_id=game_id).annotate(num_plays=Count('play')).order_by('-num_plays')
	# print(players)
	players_json = []
	for i, player in enumerate(players, 1):
		# Calculate the rank of the player
		rank = f"{i}/{len(players)}"
		# Retrieve score and add player details to the list
		players_json.append({
			"username": player.username,
			"avatar_file": player.avatar_file,
			"rank": rank,
		})
	return JsonResponse(players_json, safe=False)