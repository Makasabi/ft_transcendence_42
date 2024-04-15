import requests
from django.http import JsonResponse
from channels.layers import get_channel_layer
from rest_framework.decorators import api_view
from asgiref.sync import async_to_sync
from game.models import Game, Play
import requests
from rest_framework.decorators import api_view, authentication_classes, permission_classes
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

	if len(players['players_ids']) < 2:
		return JsonResponse({
			"error": "Not enough players"
		}, status=400)

	game = Game.objects.create(parent_id=room_id)
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


@api_view(["POST"])
def create_pool(request, round_id):
	body = request.data
	players = body['players']

	game = Game.objects.create(parent_id=round_id, mode="Tournament")
	game.save()

	for player in players:
		play = Play.objects.create(game_id=game.game_id, user_id=player['id'])
		play.save()

	return JsonResponse({
		"game": "game",
		"game_id": game.game_id
	})

@api_view(["GET"])
def retrieve_round(request, round_id):
	"""
	Retrieve the round with the given tournament_id and round_number

	json response format:
	{
		round_id: round_id,
		round_number: round_number,
		tournament_id: tournament_id
	}
	"""
	games = Game.objects.filter(parent_id=round_id, mode="Tournament")
	res = {}

	for game in games:
		plays = Play.objects.filter(game_id=game.game_id)
		players = []
		for play in plays:
			url = f"http://localhost:8000/api/user_management/user/id/{play.user_id}"
			token = f"Token {request.auth}"
			headers = {'Authorization': token}
			data = requests.get(url, headers=headers)
			players.append(data.json())
		res[f"pool_{game.game_id}"] = {
			"game_id": game.game_id,
			"players": players
		}

	return JsonResponse(res)

@api_view(["GET"])
def get_roomcode(request, game_id):
	"""
	Return the room code of the game with the given game_id

	json response format:
	{
		room_code: "room_code"
	}
	"""
	game = Game.objects.get(game_id=game_id)
	url = f"http://localhost:8000/api/rooms/get_code/{game.room_id}"
	headers = {
		"Authorization": f"Token {request.COOKIES.get('token')}"
	}
	room_code = requests.get(url, headers=headers)
	return JsonResponse({
		"room_code": room_code.json()['room_code']
	})

@api_view(["GET"])
def get_players(request, game_id):
	"""
	Return the list of players in the room with the given game_id

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
			"date_played": game.game.date_begin,
		})
	return JsonResponse(history_json, safe=False)

@api_view(["GET"])
@authentication_classes([])
@permission_classes([])
def get_game_started(request, room_id):
	"""
	Return whether the game has started in the room with the given room_id

	json response format:
	{
		game_started: game_started
	}
	"""
	game = Game.objects.filter(parent_id=room_id).first()
	if game:
		print("Game found")
		return JsonResponse({
			"game_started": True
		})
	else:
		print("Game not found")
		return JsonResponse({
			"game_started": False
	})

@api_view(["GET"])
def get_pool(request, round_id, user_id):
	"""
	Returns the game id of the user in the pool with the given round_id
	"""
	games = Game.objects.filter(parent_id=round_id, mode="Tournament")
	for game in games:
		plays = Play.objects.filter(game_id=game.game_id)
		for play in plays:
			if play.user_id == user_id:
				return JsonResponse({
					"game_id": game.game_id
				})

	return JsonResponse({
		"error": "User not found in pool"
	})