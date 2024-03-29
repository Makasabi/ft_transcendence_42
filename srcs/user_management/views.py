from django.shortcuts import render
from django.http import JsonResponse
from user_management.models import Player
from game.models import Play
from rest_framework.decorators import api_view

def profile_serializer(user):
	"""
	Retrieve user's data

	Args:
	- user: Player instance

	Returns:
	- user_data: Dictionary containing user data
	"""
	user_data = {
		"username": user.username,
		"email": user.email,
		"avatar_file": user.avatar_file,
		"global_rank": 0,
		"game_history": []
	}

	game_history = Play.objects.filter(users=user)

	for game_score in game_history:
		# Get all scores for the current game
		scores_in_game = Play.objects.filter(game=game_score.game)
		nb_players = scores_in_game.count()

		# score__gt = greater than current score
		higher_scores = scores_in_game.filter(score__gt=game_score.score).count()
		rank = f"{higher_scores + 1}/{nb_players}"

		user_data["game_history"].append({
			"rank": rank,
			"mode" : game_score.game.mode,
			"visibility" : game_score.game.visibility,
			"date_played": game_score.game.date
		})

	higher_scores = Player.objects.filter(global_score__gt=user.global_score).count()
	user_data["global_rank"] = f"{higher_scores + 1}/{Player.objects.count()}"
	return user_data

@api_view(['GET'])
def me(request):
	"""
	Return the first user in the database

	json response format:
	{
		username: "name",
		email: "email@email.fr",
		"avatar_file": "image.png",
		game_history: [
			{
				rank: "1/2",
				mode: "Normal",
				visibility: "public",
				date_played: "2021-09-30"
			},
		]
	}
	"""
	return JsonResponse(profile_serializer(request.user))


@api_view(['GET'])
def test(request):
	pass



@api_view(['POST'])
def edit_profile(request):
	"""
	Edit user's profile

	Args:
	- request: Request containing the new user data

	Returns:
	- JsonResponse: Response containing the new user data
	"""
	print(request.data)
	user = request.user
	if "username" in request.data:
		user.username = request.data["username"]
	if "email" in request.data:
		user.email = request.data["email"]
	if "avatar_file" in request.data:
		user.avatar_file = request.data["avatar_file"]
	user.save()
	return JsonResponse(profile_serializer(user))


