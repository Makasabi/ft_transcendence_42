import json
from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rooms.models import Rooms, Tournament, Occupy, Round
import random
import requests
import string
from .view_utils import compute_repartition, distribute_contestants
from datetime import datetime, timedelta

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
		"total_rounds": 1,
		"current_round": 1,
		"occupancy": 0,
		"repartition": []
	}

	if Rooms.objects.filter(room_id=roomId).exists():
		room = Rooms.objects.get(room_id=roomId)
		room_CODE = room.code
		contestants = Occupy.objects.filter(room_id=roomId)
		occupancy = len(contestants)

	total_rounds = (occupancy + 6) // 7

	tournament = Tournament.objects.create(room_id=room, total_rounds=total_rounds, current_round=1)

	tournament_data['id'] = tournament.id
	tournament_data['room_id'] = roomId
	tournament_data['room_code'] = room_CODE
	tournament_data['total_rounds'] = total_rounds
	tournament_data['current_round'] = 1
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
		return JsonResponse(tournament_serializer(tournament, occupancy))
	else:
		return JsonResponse({"error": "Room not found"})

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
	distribution = {}
	tournament = Tournament.objects.get(id=tournament_id)

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

@api_view(['POST'])
def roundCreate(request, tournament_id, round_number):

	tournament = Tournament.objects.get(id=tournament_id)

	if not Round.objects.filter(tournament_id=tournament, round_number=round_number).exists():
		# DETAIL time to seconds
		start_time = datetime.now() + timedelta(minutes=2)
		print("Start time: ", start_time)
		round = Round.objects.create(tournament_id=tournament, round_number=round_number, date_start=start_time)
		contestants = Occupy.objects.filter(room_id=tournament.room_id)
		repartition = compute_repartition(len(contestants))
		distribution = distribute_contestants(request, contestants, repartition)
		for value in distribution.values():
			url = f"http://localhost:8000/api/game/create_pool/{round.id}"
			headers = {
				"Content-Type": "application/json",
				"Authorization": f"Token {request.COOKIES.get('token')}"
			}
			data = {
				"players": value.get("players")
			}
			data = json.dumps(data)
			requests.post(url, headers=headers, data=data)
		return JsonResponse({"round_id": round.id})
		
@api_view(['GET'])
def round_start_time(request, tournament_id, round_number):
	tournament = Tournament.objects.get(id=tournament_id)
	round = Round.objects.get(tournament_id=tournament, round_number=round_number)
	return JsonResponse({"start_time": round.date_start})