from django.shortcuts import render
from django.http import JsonResponse
from user_management.models import CustomUser
from game_management.models import GameScore

# Create your views here.
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
				score: 0,
				date_played: "2021-09-30"
			},
		]
	}
	"""
	if request.user.is_authenticated:
		user = CustomUser.objects.get(username=request.user)
		return JsonResponse({"username": user.username, "email": user.email})

	first_user = CustomUser.objects.first()
	user_data = {
		"username": first_user.username,
		"email": first_user.email,
		"avatar_file": first_user.avatar_file,
		"game_history": []
	}
	
	game_history = GameScore.objects.filter(users=first_user)

	for game_score in game_history:
		# Get all scores for the current game
		scores_in_game = GameScore.objects.filter(game=game_score.game)
		nb_players = scores_in_game.count()
		
		# score__gt = greater than current score
		higher_scores = scores_in_game.filter(score__gt=game_score.score).count()
		rank = f"{higher_scores + 1}/{nb_players}"
		
		user_data["game_history"].append({
			"rank": rank,
			"date_played": game_score.game.date
			# mode and type to add
		})

	return JsonResponse(user_data)
