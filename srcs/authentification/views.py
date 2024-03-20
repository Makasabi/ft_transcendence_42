from django.http import HttpResponse
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def login(request):
	try:
		user = User.objects.get(username=request.data['username'])
		if user.check_password(request.data['password']):
			return Response({"message" : "OK", 'exist' : True})
		return Response({"message" : "KO", 'exist' : True}, status=400)
	except User.DoesNotExist:
		return Response({ 'message' : "KO", "exist" : False }, status=400)

@api_view(['POST'])
def signup(request):
	try:
		new_user = User.objects.create_user(username=request.data['username'], password=request.data['password'], email=request.data['email'])
		return Response({"message" : "OK"})
	except ValidationError as e:
		return Response({ "error" : e}, status=400)
	except IntegrityError as e:
		return Response({"error" : "Username already in use"}, status=400)

def index():
	return HttpResponse("HELLO")
