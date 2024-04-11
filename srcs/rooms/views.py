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

	total_rounds = (occupancy + 6) // 7


	# Move that part to a function
	repartition = compute_repartition(occupancy)
	repartition = distribute_contestants(request, contestants, repartition)
	

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

def compute_repartition(occupancy):
	"""
	Compute the repartition of the players in the tournament

	Args:
	- occupancy: Number of players in the room

	Returns:
	- repartition: List of players in each round
	"""
	res = occupancy % 6
	if (res != 0):
		nb_pools = occupancy // 6 + 1
	else:
		nb_pools = occupancy // 6

	first_round_elimination(occupancy, nb_pools)

	repartition = []
	extra = occupancy % nb_pools
	for i in range(nb_pools):
		places = occupancy // nb_pools
		if extra > 0:
			places += 1
			extra -= 1
		repartition.append({"places": places, "players": []})
	return repartition

def distribute_contestants(request, contestants, repartition):
	"""
	Distribute randomly the players in the games

	Args:
	- contestants: List of all players in the room
	- repartition: List of games and number of places in each game
	"""
	contestants_list = list(contestants)
	random.shuffle(contestants_list)

	distributed_contestants = {}

	for i, pool_data in enumerate(repartition, 1):
		places = pool_data.get("places", 0)
		players = contestants_list[:places]
		for player in players:
			url = f"http://localhost:8000/api/user_management/user/id/{player.player_id}"
			token = f"Token {request.auth}"
			headers = {'Authorization': token}
			data = requests.get(url, headers=headers)
			pool_data["players"].append(data.json())
		contestants_list = contestants_list[places:]
		distributed_contestants[f"pool_{i}"] = pool_data

	# Uncomment to print the repartition
	# for pool in distributed_contestants:
	# 	print(f"Pool nb {pool}")
	# 	for player in distributed_contestants[pool]["players"]:
	# 		print(player)
	# 	print("\n")
	return distributed_contestants


@api_view(['GET'])
def tournamentInfo(request, code):
	pass

def first_round_elimination(occupancy, nb_pool):
	"""
	Compute the number of players to eliminate in the first round

	Args:
	- occupancy: Number of players in the room
	- nb_pool: Number of pools

	Returns:
	- nb to eliminate in each pool
	"""

	total_elim = occupancy - ((occupancy - nb_pool) - (occupancy - nb_pool) % 6)
	elim_per_room = total_elim // nb_pool
	extra_elim = total_elim % nb_pool

	elim_per_pool = []
	for i in range(nb_pool):
		elim = elim_per_room
		if extra_elim > 0:
			elim += 1
			extra_elim -= 1
		elim_per_pool.append({'elim': elim})
	# print("\n".join([f"Pool {i}: {elim_per_pool[i]}" for i in range(nb_pool)]))
	return elim_per_pool
