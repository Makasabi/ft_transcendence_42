from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
import json
import random
import requests
import string
from decouple import config
from datetime import datetime, timedelta
from asgiref.sync import async_to_sync, sync_to_async
from channels.layers import get_channel_layer
from threading import Lock

from rooms.models import Rooms, Tournament, Occupy, Round
from .view_utils import compute_repartition, distribute_contestants, first_round_elimination, other_round_eliminations

lock = Lock()

def tournament_serializer(tournament, occupancy):
	"""
	Serialize a tournament object

	Args:
	- tournament: Tournament object

	Returns:
	- tournament_data: Dictionary containing tournament data :
		room_id
		total_rounds
		current_round
	"""
	tournament_data = {
		"id": tournament.id,
		"total_rounds": tournament.total_rounds,
		"current_round": tournament.current_round,
		"occupancy": occupancy,
	}
	return tournament_data

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
		"total_rounds": 0,
		"current_round": 0,
		"occupancy": 0,
		"repartition": []
	}

	if Rooms.objects.filter(room_id=roomId).exists():
		room = Rooms.objects.get(room_id=roomId)
		room_CODE = room.code
		contestants = Occupy.objects.filter(room_id=roomId)
		occupancy = len(contestants)

	total_rounds = (occupancy + 6) // 7

	tournament = Tournament.objects.create(room_id=room, total_rounds=total_rounds)

	tournament_data['id'] = tournament.id
	tournament_data['room_id'] = roomId
	tournament_data['room_code'] = room_CODE
	tournament_data['total_rounds'] = total_rounds
	tournament_data['current_round'] = 0
	tournament_data['occupancy'] = occupancy

	return JsonResponse(tournament_data)

@api_view(['GET'])
def tournamentInfo(request, room_id):
	"""
	get tournament data

	Args:
	- request: Request object
	- code: Room code
	
	Returns:
		json response containing tournament data
	"""
	if Rooms.objects.filter(room_id=room_id).exists():
		room = Rooms.objects.get(room_id=room_id)
		contestants = Occupy.objects.filter(room_id=room)
		occupancy = len(contestants)
		tournament = Tournament.objects.get(room_id=room)
		print("Update tournament PLEEEEASE")
		update_tournament(tournament.id)
		print("Update tournament PLEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEASE")
		tournament = Tournament.objects.get(room_id=room)
		print(tournament_serializer(tournament, occupancy))
		return JsonResponse(tournament_serializer(tournament, occupancy))
	else:
		return JsonResponse({"error": "No tournament or too many tournaments found for this room"}, status=404)

def update_tournament(tournament_id):
	lock.acquire()
	try:
		print("Update tournament")
		tournament = Tournament.objects.get(id=tournament_id)
		if (tournament.current_round == 0):
			print("First round")
			roundCreate(tournament_id)
		else:
			print("Other round")
			round = Round.objects.get(tournament_id=tournament, round_number=tournament.current_round)
			url = f"http://localhost:8000/api/game/retrieve_round/{round.id}"
			headers = {
				'Authorization': f"App {config('APP_KEY', default='app-insecure-qmdr&-k$vi)z$6mo%$f$td!qn_!_*-xhx864fa@qo55*c+mc&z')}"
			}
			response = requests.get(url, headers=headers)
			if len(response.json()) == 0:
				print("No games in round")
				return
			if all([game['end_status'] != None for game in response.json().values()]):
				print("All games are finished")
				print([game['end_status'] != "none" for game in response.json().values()])
				print(*[game for game in response.json().values()], sep="\n\n")
				# kick out losers
				eliminations(round, response.json())
				roundCreate(tournament_id)
	finally:
		print("Tournament updated")
		lock.release()

def eliminations(round: Round, pools: dict):
	print("Eliminations")
	room = round.tournament_id.room_id
	if round.round_number == 1:
		elim_per_pool = first_round_elimination(len(Occupy.objects.filter(room_id=room)), len(pools))
	else:
		elim_per_pool = other_round_eliminations(len(pools))
	for i, pool in enumerate(pools.values()):
		url = f"http://localhost:8000/api/game/get_results/{pool['game_id']}"
		headers = {
			'Authorization': f"App {config('APP_KEY', default='app-insecure-qmdr&-k$vi)z$6mo%$f$td!qn_!_*-xhx864fa@qo55*c+mc&z')}"
		}
		game_results = requests.get(url, headers=headers)
		game_results = game_results.json()
		eliminated = game_results[:elim_per_pool[i]['elim']]
		print("Eliminated", eliminated)
		for player in eliminated:
			print("Player", player)
			Occupy.objects.filter(room_id=room, player_id=player['user_id']).delete()
			channel_layer = get_channel_layer()
			async_to_sync(channel_layer.group_send)(
				f"tournament_{round.tournament_id.id}",
				{
					"type": "eliminated",
					"player_id": player['user_id']
				})

@api_view(['GET'])
def roundInfo(request, tournament_id, round_number):
	"""
	Get round informations

	Args:
	- request: Request object
	- tournament_id: Tournament ID

	Returns:
	- res: Dictionary containing round data
		- round_id
		- round_number
		- tournament_id
		- distribution
		- start_time
	"""
	round_data = {
		"round_id": 0,
		"round_number": 0,
		"tournament_id": "",
		"start_time": 0
	}

	res = {}
	tournament = Tournament.objects.get(id=tournament_id)

	print(round_number)
	round = Round.objects.get(tournament_id=tournament, round_number=round_number)
	url = f"http://localhost:8000/api/game/retrieve_round/{round.id}"
	token = f"Token {request.auth}"
	headers = {'Authorization': token}
	response = requests.get(url, headers=headers)
	res['distribution'] = response.json()

	round_data['round_id'] = round.id
	round_data['round_number'] = round.round_number
	round_data['tournament_id'] = tournament_id
	round_data['start_time'] = round.date_start

	res['round_data'] = round_data

	return JsonResponse(res)

def roundCreate(tournament_id):
	tournament = Tournament.objects.get(id=tournament_id)
	tournament.current_round += 1
	tournament.save()

	print("Create round")
	if not Round.objects.filter(tournament_id=tournament, round_number=tournament.current_round).exists():
		print("Create round2")
		start_time = datetime.now() + timedelta(minutes=0.5)
  
		round = Round.objects.create(tournament_id=tournament, round_number=tournament.current_round, date_start=start_time)
		contestants = Occupy.objects.filter(room_id=tournament.room_id)
		repartition = compute_repartition(len(contestants))
		
		distribution = distribute_contestants(contestants, repartition)
		for value in distribution.values():
			url = f"http://localhost:8000/api/game/create_pool/{round.id}"
			headers = {
				"Content-Type": "application/json",
				'Authorization': f"App {config('APP_KEY', default='app-insecure-qmdr&-k$vi)z$6mo%$f$td!qn_!_*-xhx864fa@qo55*c+mc&z')}"
			}
			data = {
				"players": value.get("players")
			}
			data = json.dumps(data)
			requests.post(url, headers=headers, data=data)
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			f"tournament_{tournament_id}",
			{
				"type": "round_created",
			})
	print("Round created")

@api_view(['GET'])
def round_start_time(request, tournament_id, round_number):
	tournament = Tournament.objects.get(id=tournament_id)
	round = Round.objects.get(tournament_id=tournament, round_number=round_number)
	return JsonResponse({"start_time": round.date_start})


@api_view(['GET'])
def get_round_code(request, round_id):
	"""
	Return the room code of the game with the given round_id

	json response format:
	{
		room_code: "room_code"
	}
	"""
	round = Round.objects.get(id=round_id)
	code = round.tournament_id.room_id.code

	return JsonResponse({
		"room_code": code
	})
