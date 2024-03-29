from django.shortcuts import render
from django.http import JsonResponse
from user_management.models import Player, BeFriends
from game_management.models import Play
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
	if "password" in request.data:
		user.set_password(request.data["password"])
	user.save()
	return JsonResponse(profile_serializer(user))

# function to get a specific user
@api_view(['GET'])
def user(request, username):
	"""
	Return a user from the database

	json response format:
	"""
	user = Player.objects.filter(username=username).first()
	if user is None:
		return JsonResponse({'error': 'User not found'}, status=404)
	return JsonResponse(profile_serializer(user))

@api_view(['POST'])
def add_friend(request, username):
	"""
	Add a friend to the user's friend list

	Args:
	- request: Request containing the friend's username

	Returns:
	- JsonResponse: Response containing the new user data
	"""
	user1 = request.user.username
	user2 = username
	# add connection in BeFriends table
	BeFriends.objects.create(user1=Player.objects.get(username=user1), user2=Player.objects.get(username=user2))
	BeFriends.objects.create(user1=Player.objects.get(username=user2), user2=Player.objects.get(username=user1))
	return JsonResponse(profile_serializer(request.user))

@api_view(['DELETE'])
def remove_friend(request, username):
	"""
	Remove a friend from the user's friend list

	Args:
	- request: Request containing the friend's username

	"""
	user1 = request.user.username
	user2 = username
	# remove connection in BeFriends table
	BeFriends.objects.filter(user1__username=user1, user2__username=user2).delete()
	BeFriends.objects.filter(user1__username=user2, user2__username=user1).delete()
	return JsonResponse(profile_serializer(request.user))

@api_view(['GET'])
def friends(request, username):
	"""
	Check if two users are friends
	
	Args:
	- request: Request containing the friend's username

	Returns:
	- bool: True if the two users are friends, False otherwise
	"""
	user1 = request.user.username
	user2 = username
	if BeFriends.objects.filter(user1__username=user1, user2__username=user2).exists() \
		or BeFriends.objects.filter(user1__username=user2, user2__username=user1).exists():
		return JsonResponse({'friends': True})
	return JsonResponse({'friends': False})
	