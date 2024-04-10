from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rooms.models import Rooms, Tournament, Occupy
import random
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

@api_view(['POST'])
def create_tournament(request, roomId):
	"""
	Create a new tournament

	Args:
	- request: Request object
	- roomId: Room ID

	Returns:
	- tournament_data: Dictionary containing tournament data :
		room_id
		total_rounds
		current_round
	"""
	tournament_data = {
		"room_id": roomId,
		"room_code": "",
		"total_rounds": 1,
		"current_round": 1,
		"occupancy": 0,
		"repartition": []
	}

	if Rooms.objects.filter(room_id=roomId).exists():
		room_ID = Rooms.objects.get(room_id=roomId)
		room_CODE = room_ID.code
		contestants = Occupy.objects.filter(room_id=roomId)
		occupancy = len(contestants)

	# TODO: compute total_rounds based on occupancy HERE
	total_rounds = (occupancy + 6) // 7
	print("Total rounds ", total_rounds)
	repartition = compute_repartition(occupancy, total_rounds)

	# distribute players randomly in the games
	distribute_contestants(contestants, repartition)

	Tournament.objects.create(room_id=room_ID, total_rounds=total_rounds, current_round=1)

	tournament_data['room_id'] = roomId
	tournament_data['room_code'] = room_CODE
	tournament_data['total_rounds'] = total_rounds
	tournament_data['current_round'] = 3
	tournament_data['occupancy'] = occupancy
	tournament_data['repartition'] = repartition

	return JsonResponse(tournament_data)

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

def compute_repartition(occupancy, total_rounds):
	"""
	Compute the repartition of the players in the tournament

	Args:
	- occupancy: Number of players in the room

	Returns:
	- repartition: List of players in each round
	"""
	repartition = []
	extra = occupancy % total_rounds
	for i in range(total_rounds):
		places = occupancy // total_rounds
		if extra > 0:
			places += 1
			extra -= 1
		repartition.append({"places": places, "players": []})
	print("For {} players, the repartition is: {}".format(occupancy, repartition))
	return repartition

def distribute_contestants(contestants, repartition):
	"""
	Distribute randomly the players in the games

	Args:
	- contestants: List of all players in the room
	- repartition: List of games and number of places in each game
	"""
	print("Distributing players in the games")

	# Convert QuerySet to list
	contestants_list = list(contestants)

	# Shuffle the contestants list randomly
	random.shuffle(contestants_list)

	# Distribute contestants into games according to the specified repartition
	distributed_contestants = {}
	for i, round_data in enumerate(repartition, 1):
		places = round_data.get("places", 0)
		players = contestants_list[:places]
		contestants_list = contestants_list[places:]
		distributed_contestants[f"round_{i}"] = players
		for player in players:
			print(f"Round {i} : Player {player.player_id}")
	return distributed_contestants


@api_view(['GET'])
def tournamentInfo(request, code):
	pass