import random
from django.http import HttpResponse
from user_management.models import Player
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .serializers import PlayerSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

import requests

##### Authentication #####

@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def login(request):
	try:
		print(request.data)
		user = Player.objects.get(username=request.data['username'])
		if not user.check_password(request.data['password']):
			return Response({"error" : "Wrong password"}, status=status.HTTP_400_BAD_REQUEST)
		token, _ = Token.objects.get_or_create(user=user)
		serializer = PlayerSerializer(instance=user)

		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_add)('public_room', 'user_%s' % user.id)

		return Response({ "token" : token.key, "user" : serializer.data }, status=status.HTTP_200_OK)
	except Player.DoesNotExist:
		return Response({ "error" : "User does not exist"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def check_token(request):
	"""
	Communication endpoint to check if a token is valid for other services
	"""
	return Response({"message": "Token is valid"}, status=status.HTTP_200_OK)

##### Registration #####

@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def signup(request):
	serializer = PlayerSerializer(data=request.data)
	if not serializer.is_valid():
		print("error : ", serializer.errors)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	serializer.save()
	user = Player.objects.get(username=request.data["username"])
	
	# random avatar file from /front/ressources/img/png/avatar_XXX.png
	avatar_file = "/front/ressources/img/png/avatar_0" + str(random.randint(0, 3)) + ".png"
	user.avatar_file = avatar_file
	user.save()
	token = Token.objects.create(user=user)
	return Response({"token" : token.key, "user" : serializer.data}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def forty2_auth(request):
	print(request.data)
	data = {
		'grant_type': 'authorization_code',
		'client_id': 'u-s4t2ud-778802c450d2090b49c6c92d251ff3d1fbb51b03a9284f8f43f5df0af1dae8fa',
		'client_secret': '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',
		'code': request.data['code'],
		'redirect_uri': 'http://localhost:8000/forty2',
	}
	print(data)
	response = requests.post("https://api.intra.42.fr/oauth/token", data=data)
	data = response.json()
	if 'error' in data.keys():
		return Response(data, status=status.HTTP_400_BAD_REQUEST)
	print(data)
	return Response(data)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def is_registered(request):
	try:
		user = Player.objects.get(email=request.data['email'])
		token, created = Token.objects.get_or_create(user=user)
		serializer = PlayerSerializer(instance=user)
		return Response({ "token" : token.key, "user" : serializer.data }, status=status.HTTP_200_OK)
	except Player.DoesNotExist:
		return Response({"error" : "User not registered"}, status=status.HTTP_400_BAD_REQUEST)
