from django.contrib.auth.models import User
from django.db import IntegrityError
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .serializers import UserSerializer
import requests

@api_view(['POST'])
def login(request):
	try:
		user = User.objects.get(username=request.data['username'])
		if not user.check_password(request.data['password']):
			return Response({"error" : "Wrong password"}, status=status.HTTP_400_BAD_REQUEST)
		token, created = Token.objects.get_or_create(user=user)
		serializer = UserSerializer(instance=user)
		return Response({ "token" : token.key, "user" : serializer.data }, status=status.HTTP_200_OK)
	except User.DoesNotExist:
		return Response({ "error" : "User does not exist"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def signup(request):
	serializer = UserSerializer(data=request.data)
	print(request.data)
	if not (serializer.is_valid()):
		return Response({"error" : serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
	serializer.save()
	user = User.objects.get(username=request.data["username"])
	token = Token.objects.create(user=user)
	return Response({"token" : token.key, "user" : serializer.data}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def check_token(request):
	print("Request auth")
	return Response({"message": "Token is valid"}, status=status.HTTP_200_OK)
#	return Response({"user" : user})

@api_view(['POST'])
def forty2_auth(request):
    print(request.data)
    data = {
        'grant_type': 'authorization_code',
        'client_id': 'u-s4t2ud-778802c450d2090b49c6c92d251ff3d1fbb51b03a9284f8f43f5df0af1dae8fa',
        'client_secret': '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',
        'code': request.data['code'],
        'redirect_uri': 'http://localhost:8000/username',
    }
    print(data)
    response = requests.post("https://api.intra.42.fr/oauth/token", data=data)
    data = response.json()
    if 'error' in data.keys():
        return Response(data, status=status.HTTP_400_BAD_REQUEST)
    print(data)
    return Response(data)

@api_view(['POST'])
def is_registered(request):
	try:
		user = User.objects.get(email=request.data['email'])
		token, created = Token.objects.get_or_create(user=user)
		serializer = UserSerializer(instance=user)
		return Response({ "token" : token.key, "user" : serializer.data }, status=status.HTTP_200_OK)
	except User.DoesNotExist:
		return Response({"error" : "User not registered"}, status=status.HTTP_400_BAD_REQUEST)
