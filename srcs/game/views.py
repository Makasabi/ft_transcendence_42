from django.http import JsonResponse
from channels.layers import get_channel_layer
from rest_framework.decorators import api_view
from asgiref.sync import async_to_sync

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
