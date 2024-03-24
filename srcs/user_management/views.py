from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.models import User
from game_management.models import GameScore

# Create your views here.
def me(request):
	"""
	Return the first user in the database

	json response format:
	{
		username: "name",
		email: "email@email.fr",
		game_history: [
			{
				score: 0,
				date_played: "2021-09-30"
			},
		]
	}
	"""
	if request.user.is_authenticated:
		user = User.objects.get(username=request.user)
		return JsonResponse({"username": user.username, "email": user.email})

	first_user = User.objects.first()
	user_data = {
		"username": first_user.username,
		"email": first_user.email,
		"game_history": []
	}
	
	game_history = GameScore.objects.filter(users=first_user)
	for game_score in game_history:
		user_data["game_history"].append({
			"score": game_score.score,
			"date_played": game_score.game.date
		})
	return JsonResponse(user_data)
