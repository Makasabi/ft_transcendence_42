import requests
from django.http import JsonResponse
from channels.layers import get_channel_layer
from rest_framework.decorators import api_view
from asgiref.sync import async_to_sync

from game.models import Game

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
		game_id: game_id
	}
	"""
	# @TODO Check if user is master of the room
	body = request.data

	url = f"http://localhost:8000/api/rooms/{room_id}/players"
	headers = {
		"Authorization": f"Token {request.COOKIES.get('token')}"
	}
	players = requests.get(url, headers=headers)
	if players.status_code == 404:
		return JsonResponse({
			"error": "Players not found"
		}, status=404)
	if players.status_code != 200:
		print("Error code:", players.status_code)
		return JsonResponse({
			"error": "Internal server error"
		}, status=500)
	players = players.json()

	game = Game.objects.create(room_id=room_id)
	game.save()

	async_to_sync(get_channel_layer().send)(
		"game_consumer",
		{
			"type": "game.start",
			"game_id": game.game_id,
			"players": players['players_ids']
		}
	)
	return JsonResponse({
		"game": "game",
		"game_id": game.game_id
	})
