from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rooms.models import Rooms, Tournament, Occupy
import random
import requests
import string

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
	# username = request.data['username']

	code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
	while Rooms.objects.filter(code=code).exists():
		code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

	Rooms.objects.create(roomMode=request.data['roomMode'], visibility=request.data['visibility'], code=code)

	room_data['code'] = code
	room_data['room_id'] = Rooms.objects.get(code=code).room_id
	room_data['date'] = Rooms.objects.get(code=code).date

	return JsonResponse(room_data)

@api_view(['GET'])
def roomCode(request, roomCode):
	"""
	Verify if a room exists

	Args:
	- request: Request object

	Returns:
	- room_status: Dictionary containing room status :
		code
		status
		message
	"""
	code = roomCode
	room_status = {
		"code": code,
		"status": False,
		"message": ""
	}

	if Rooms.objects.filter(code=code).exists():
		room_status['status'] = True
		room_status['message'] = "Room exists"
	else:
		room_status['message'] = "Room does not exist"

	return JsonResponse(room_status)

@api_view(['GET'])
def roomInfo(request, roomCode):
	"""
	Get room information

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
	code = roomCode
	room_data = {
		"room_id": 0,
		"date": "",
		"roomMode": "",
		"visibility": "",
		"code": code
	}

	if Rooms.objects.filter(code=code).exists():
		room_data['room_id'] = Rooms.objects.get(code=code).room_id
		room_data['date'] = Rooms.objects.get(code=code).date
		room_data['roomMode'] = Rooms.objects.get(code=code).roomMode
		room_data['visibility'] = Rooms.objects.get(code=code).visibility

	return JsonResponse(room_data)


@api_view(['GET'])
def roomPlayers(request, room_id):
	"""
	Get players in a room

	Args:
	- request: Request object
	- room_id: Room id

	Returns:
	- players: List of players in the room
	"""
	players = []

	if Occupy.objects.filter(room_id=room_id).exists():
		occupants = Occupy.objects.filter(room_id=room_id)
		for occupant in occupants:
			players.append(occupant.player_id)

	return JsonResponse({'players_ids': players})

@api_view(['GET'])
def get_code(request, room_id):
	"""
	Return the room code of the game with the given game_id

	json response format:
	{
		room_code: "room_code"
	}
	"""
	room = Rooms.objects.get(room_id=room_id)

	return JsonResponse({
		"room_code": room.code
	})