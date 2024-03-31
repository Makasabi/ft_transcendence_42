from django.shortcuts import render
from django.http import JsonResponse
from user_management.models import Player
from game.models import Play
from rest_framework.decorators import api_view
from rooms.models import Rooms, Occupy
import random
import string

# Create your views here.
@api_view(['POST'])
def create_room(request):
	"""
	Create a new room

	Args:
	- request: Request object
	
	Returns:
	- room_data: Dictionary containing room data :
		room_id
		date
		roomMode
		visibility
		code
	"""

	room_data = {
		"room_id": 0,
		"date": "",
		"roomMode": request.data['roomMode'],
		"visibility": request.data['visibility'],
		"code": ""	
	}
	username = request.data['username']
	
	# geneate random rommCode of 6 string.ascii_uppercase + string.digits
	# checks if roomCode already exists
	# if not, create room
	# else, generate another roomCode
	code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
	while Rooms.objects.filter(code=code).exists():
		code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

	Rooms.objects.create(roomMode=request.data['roomMode'], visibility=request.data['visibility'], code=code)

	room_data['code'] = code
	room_data['room_id'] = Rooms.objects.get(code=code).room_id
	room_data['date'] = Rooms.objects.get(code=code).date

	print(room_data)
	return JsonResponse(room_data)
