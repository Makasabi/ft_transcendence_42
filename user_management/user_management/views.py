import re
from django.shortcuts import render
from django.http import JsonResponse
from user_management.models import Player, BeFriends
from rest_framework.decorators import api_view
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
import os
import requests
from rest_framework.decorators import api_view, authentication_classes, permission_classes


def simple_serializer(request, user):
	"""
	Retrieve user's data

	Args:
	- user: Player instance

	Returns:
	- user_data: Dictionary containing user data
	"""
	user_data = {
		"id": user.id,
		"username": user.username,
		"avatar_file": user.avatar_file,
	}
	return user_data


def profile_serializer(request, user):
	"""
	Retrieve user's data

	Args:
	- user: Player instance

	Returns:
	- user_data: Dictionary containing user data
	"""
	user_data = {
		"id": user.id,
		"username": user.username,
		"email": user.email,
		"avatar_file": user.avatar_file,
		"global_rank": 0,
		"game_history": []
	}
	user_id = user.id
	url = f"http://proxy/api/game/get_history/{user_id}"
	token = f"Token {request.auth}"
	headers = {'Authorization': token}
	game_history = requests.get(url, headers=headers)

	if (game_history.status_code != 200):
		user_data["game_history"] = []
	else:
		for game in game_history.json():
			user_data["game_history"].append(game)
	higher_scores = Player.objects.filter(global_score__gt=user.global_score).count()
	user_data["global_rank"] = f"{higher_scores + 1}/{Player.objects.count()}"
	return user_data

@api_view(['GET'])
def me_id(request):
	"""
	Return id of the user
	"""
	return JsonResponse({'id': request.user.id})

@api_view(['GET'])
def me_username(request):
	"""
	Return username of the user
	"""
	return JsonResponse({'username': request.user.username})


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
	return JsonResponse(profile_serializer(request, request.user))


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
	username_pattern = r'^[a-zA-Z0-9_-]+$'
	new_username = request.data["username"]
	if (user.username != new_username):
		if Player.objects.filter(username=new_username):
			# jsonresponse
			return JsonResponse({"error": "Username already used", "username" : user.username}, status=400)
	if not re.match(username_pattern, new_username):
		return JsonResponse({"error": "Username must contain only letters, numbers, _ and -", "username" : user.username}, status=400)
	elif len(new_username) < 3 or len(new_username) > 10:
		return JsonResponse({"error": "Username must be between 3 and 10 characters", "username" : user.username}, status=400)

	user.username = new_username
	if "avatar_file" in request.data:
		user.avatar_file = request.data["avatar_file"]

	if "password" in request.data and request.data["password"] != "":
		new_password = request.data["password"]
		print("New pw :", new_password)
		# password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character
		password_pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])'
		if not re.match(password_pattern, new_password):
			return JsonResponse({"error": "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character", "username" : user.username, "password" : "errror"}, status=400)
		elif len(new_password) < 6:
			return JsonResponse({"error": "Passsword must be at least 6 characters", "username" : user.username, "password" : "errror"}, status=400)
		user.set_password(request.data["password"])
	user.save()
	return JsonResponse(profile_serializer(request, user))


@api_view(['POST'])
def upload_avatar(request):
	"""
	Upload a new avatar for the user

	Args:
	- request: Request containing the new avatar file

	Returns:
	- JsonResponse: Response containing the new user data
	"""
	if request.method == 'POST' and request.FILES.get('avatar_file'):
		avatar_file = request.FILES['avatar_file']
		file_path = os.path.join(settings.BASE_DIR, 'uploads', avatar_file.name)
		with open(file_path, 'wb+') as destination:
			for chunk in avatar_file.chunks():
				destination.write(chunk)
		request.user.avatar_file = "/front/ressources/uploads/" + avatar_file.name
		print("avatar file is", request.user.avatar_file)
		request.user.save()
		return JsonResponse({'file_path': request.user.avatar_file})
	else:
		return JsonResponse({'error': 'No avatar file provided'}, status=400)


@api_view(['GET'])
def user_username(request, username):
	"""
	Get user by username

	json response format:
	"""
	user = Player.objects.filter(username=username).first()
	if user is None:
		return JsonResponse({'error': 'User not found'}, status=404)
	return JsonResponse(profile_serializer(request, user))


@api_view(['GET'])
def user_id(request, id):
	"""
	Get user by id

	json response format:
	"""
	user = Player.objects.filter(id=id).first()
	if user is None:
		return JsonResponse({'error': 'User not found'}, status=404)
	data = simple_serializer(request, user)
	return JsonResponse(data, safe=False)

# function to return an array of users that match the username
@api_view(['GET'])
def user_search(request, username):
	"""
	Return a list of users from the database that match the username

	json response format:
	"""
	users = Player.objects.filter(username__startswith=username)
	print(users)
	users_json = []
	for user in users:
		users_json.append({
			"username": user.username,
		})
	return JsonResponse(users_json, safe=False)

@api_view(['POST'])
def add_friend(request, user_id):
	"""
	Add a friend to the user's friend list

	Args:
	- request: Request containing the friend's username

	Returns:
	- JsonResponse: Response containing the new user data
	"""
	user1 = request.user.id
	user2 = user_id
	if user1 == user2:
		return JsonResponse({'error': 'Cannot add yourself as a friend'}, status=400)
	BeFriends.objects.create(user1=user1, user2=user2)
	return JsonResponse(profile_serializer(request, request.user))

@api_view(['DELETE'])
def remove_friend(request, user_id):
	"""
	Remove a friend from the user's friend list

	Args:
	- request: Request containing the friend's username

	"""
	user1 = request.user.id
	user2 = user_id

	BeFriends.objects.filter(user1=user1, user2=user2).delete()
	BeFriends.objects.filter(user1=user2, user2=user1).delete()
	return JsonResponse(profile_serializer(request, request.user))


@api_view(['GET'])
def is_friend(request, user_id):
	"""
	Check if two users are friends

	Args:
	- request: Request containing the friend's username

	Returns:
	- bool: True if the two users are friends, False otherwise
	"""
	user1 = request.user.id
	user2 = user_id
	if BeFriends.objects.filter(user1=user1, user2=user2).exists() \
		and BeFriends.objects.filter(user1=user2, user2=user1).exists():
		return JsonResponse({'friends': True})
	elif BeFriends.objects.filter(user1=user1, user2=user2).exists():
		return JsonResponse({'friends': "Request Pending"})
	elif BeFriends.objects.filter(user1=user2, user2=user1).exists():
		return JsonResponse({'friends': "Invite Pending"})
	return JsonResponse({'friends': False})



@api_view(['GET'])
def get_friends(request):
	"""
	Return all friends of the user

	Returns:
	- JsonResponse: Response containing the list of friends
	"""
	friends_json = []
	for friend in BeFriends.objects.filter(user1=request.user.id):
		data = Player.objects.get(id=friend.user2)
		friends_json.append({
			"username": data.username,
			"avatar_file": data.avatar_file
		})
	return JsonResponse(friends_json, safe=False)

@api_view(['GET'])
def find_match(request, username):
	"""
	Return all friends of the user

	Returns:
	- JsonResponse: Response containing the list of friends
	"""
	current_user = request.user.username
	if (current_user == username):
		return JsonResponse({'status': 'ok', 'username': current_user})
	elif Player.objects.filter(username=username):
		return JsonResponse({'status': 'error',  'username': current_user})
	return JsonResponse({'status': 'ok', 'username': current_user})

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def switch_online(request, username, status):
	"""
	Switch user online status
	"""
	try:
		user = Player.objects.get(username=username)
	except Player.DoesNotExist:
		return JsonResponse({'status': 'error', 'message': 'User not found'})
	if (status == 'online'):
		user.online = True
	else:
		user.online = False
		user.valid_twoFA = False
	user.save()
	return JsonResponse({'status': 'ok', 'is_online': user.online})

@api_view(['GET'])
def get_online_status(request, username):
	"""
	Return the online status of a user
	"""
	user = Player.objects.filter(username=username).first()
	return JsonResponse({'is_online': user.online})

@api_view(['GET'])
def twoFA(request):
	"""
	Return the two factor authentication status of a user
	"""
	return JsonResponse({'twoFA': request.user.twoFA})

@api_view(['POST'])
def switch_twoFA(request):
	"""
	Switch user two factor authentication status
	"""
	if request.user.twoFA:
		request.user.twoFA = False
	else:
		request.user.twoFA = True
	request.user.save()
	return JsonResponse({'twoFA': request.user.twoFA})

@api_view(['POST'])
def add_score(request, score, user_id):
	"""
	Add score to user's global score
	"""
	auth = request.headers.get('Authorization')
	if request.headers.get('Authorization') is None:
		return JsonResponse({'error': 'Unauthorized'}, status=401)
	auth = auth.split()
	if len(auth) != 2:
		return JsonResponse({'error': 'Unauthorized'}, status=401)
	if auth[0] != 'App':
		return JsonResponse({'error': 'Unauthorized'}, status=401)
	user = Player.objects.get(id=user_id)
	user.global_score += score
	user.save()
	return JsonResponse({'global_score': user.global_score})
