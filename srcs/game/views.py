from django.http import JsonResponse
from channels.layers import get_channel_layer
from rest_framework.decorators import api_view
from asgiref.sync import async_to_sync
from game.models import Game, Play
from django.db.models import Count
import requests


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
	plays = Play.objects.filter(game_id=game_id).order_by('-score')
	
	players_json = []

	for i, play in enumerate(plays, 1):
		# api call to User DB to get username and avatar_file
		url = f"http://localhost:8000/api/user_management/user/id/{play.user_id}"
		token = request.COOKIES.get('token')
		headers = {'Authorization': "Token " + token}
		user = requests.get(url, headers=headers)
		rank = f"{i}/{len(plays)}"
		players_json.append({
			"username": user.json()['username'],
			"avatar_file": user.json()['avatar_file'],
			"rank": rank,
		})
	return JsonResponse(players_json, safe=False)

@api_view(["GET"])
def get_history(request, player_id):
	"""
	Return the game history of the player with the given player_id

	json response format:
	{
		history: [
			{
				game_id: game_id,
				score: score,
				date: date
			},
			...
		]
	}
	"""
	history = Play.objects.filter(user_id=player_id)
	history_json = []
	for game in history:
		scores_in_game = Play.objects.filter(game=game.game)
		nb_players = scores_in_game.count()

		# score__gt = greater than current score
		higher_scores = scores_in_game.filter(score__gt=game.score).count()
		rank = f"{higher_scores + 1}/{nb_players}"

		history_json.append({
			"game_id": game.game.game_id,
			"rank": rank,
			"mode" : game.game.mode,
			"visibility" : game.game.visibility,
			"date_played": game.game.date
		})
	return JsonResponse(history_json, safe=False)
