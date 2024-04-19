from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
import random
import requests
import json
from decouple import config
from datetime import datetime, timedelta
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from threading import Lock

from rooms.models import Rooms, Tournament, Occupy, Round

lock = Lock()

def compute_repartition(occupancy):
	"""
	Compute the repartition of the players in the tournament for the first round

	Args:
	- occupancy: Number of players in the room

	Returns:
	- repartition: List of players in each pool
	"""
	res = occupancy % 6
	if (res != 0):
		nb_pools = occupancy // 6 + 1
	else:
		nb_pools = occupancy // 6

	repartition = []
	extra = occupancy % nb_pools
	for i in range(nb_pools):
		places = occupancy // nb_pools
		if extra > 0:
			places += 1
			extra -= 1
		repartition.append({"places": places, "players": []})
	return repartition

def distribute_contestants(contestants, repartition):
	"""
	Distribute randomly the players in the pools

	Args:
	- contestants: List of all players in the room
	- repartition: List of games and number of places in each pool
	"""
	contestants_list = list(contestants)
	random.shuffle(contestants_list)

	distributed_contestants = {}

	for i, pool_data in enumerate(repartition, 1):
		places = pool_data.get("places", 0)
		players = contestants_list[:places]
		for player in players:
			url = f"http://proxy/api/user_management/user/id/{player.player_id}"
			headers = {
				'Authorization': f"App {config('APP_KEY', default='app-insecure-qmdr&-k$vi)z$6mo%$f$td!qn_!_*-xhx864fa@qo55*c+mc&z')}"
			}
			data = requests.get(url, headers=headers)
			if data.status_code != 200:
				raise Exception("No player found")
			pool_data["players"].append(data.json())
		contestants_list = contestants_list[places:]
		distributed_contestants[f"pool_{i}"] = pool_data

	return distributed_contestants

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
	return elim_per_pool

def other_round_eliminations(nb_pool):
	"""
	Compute the number of players to eliminate in the other rounds

	Args:
	- nb_pool: Number of pools

	Returns:
	- nb to eliminate in each pool
	"""
	elim_per_pool = []
	elim = 6 // nb_pool
	rest = 6 % nb_pool
	for i in range(nb_pool):
		elim_per_pool.append({'elim': elim + int(rest > 0)})
		rest -= 1
	return elim_per_pool

def CheckPlayerAccess(user_id, tournament_id):
	"""
	Check if the player has access to the tournament

	Args:
	- user_id: User ID
	- tournament_id: Tournament ID

	Returns:
	- Boolean: True if the player has access to the tournament, False otherwise
	- Loosed or Uninvited if the player has already played or is not invited
	"""
	try:
		tournament = Tournament.objects.get(id=tournament_id)
		round = Round.objects.get(tournament_id=tournament, round_number=1)
		url = "http://proxy/api/game/has_played/" + str(round.id) + "/" + str(user_id)
		headers = {
			'Authorization': f"App {config('APP_KEY', default='app-insecure-qmdr&-k$vi)z$6mo%$f$td!qn_!_*-xhx864fa@qo55*c+mc&z')}"
		}
		response = requests.get(url, headers=headers)
		if response.json()['has_played'] == True:
			room_id = tournament.room_id
			if Occupy.objects.filter(player_id=user_id, room_id=room_id).exists():
				return True
			else:
				return "Loosed"
		else:
			return "Uninvited"
	except Round.DoesNotExist:
		print("Round does not exist")
		return False
	except Tournament.DoesNotExist:
		print("Tournament does not exist")
		return False

def roundCreate(tournament_id):
	"""
	Create a new round for the tournament

	Args:
	- tournament_id: Tournament ID
	"""
	print(f"🌀 Create round for tournament with id {tournament_id}")
	tournament = Tournament.objects.get(id=tournament_id)
	tournament.current_round += 1
	print("Current round", tournament)
	if (tournament.current_round > tournament.total_rounds):
		winner = getWinnerId(tournament_id)
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			f"tournament_{tournament_id}",
			{
				"type": "tournament_finished",
				"winner": winner,
			})
		return
	tournament.save()

	if not Round.objects.filter(tournament_id=tournament, round_number=tournament.current_round).exists():
		start_time = datetime.now() + timedelta(minutes=0.3)

		round = Round.objects.create(tournament_id=tournament, round_number=tournament.current_round, date_start=start_time)
		contestants = Occupy.objects.filter(room_id=tournament.room_id)
		repartition = compute_repartition(len(contestants))
		print("🎼 Repartition", repartition)

		distribution = distribute_contestants(contestants, repartition)
		for value in distribution.values():
			url = f"http://proxy/api/game/create_pool/{round.id}"
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
				"code": tournament.room_id.code
			})
	print("Round created")

def getWinnerId(tournament_id):
	"""
	Get the winner of the tournament

	Args:
	- tournament_id: Tournament ID

	Returns:
	- User ID of the winner
	"""
	tournament = Tournament.objects.get(id=tournament_id)
	final_round = Round.objects.get(tournament_id=tournament, round_number=tournament.total_rounds)
	url = f"http://proxy/api/game/retrieve_round/{final_round.id}"
	headers = {
				"Content-Type": "application/json",
				'Authorization': f"App {config('APP_KEY', default='app-insecure-qmdr&-k$vi)z$6mo%$f$td!qn_!_*-xhx864fa@qo55*c+mc&z')}"
			}
	rounds = requests.get(url, headers=headers)
	finalpool = rounds.json()
	for pool in finalpool.values():
		url = f"http://proxy/api/game/get_results/{pool['game_id']}"
		headers = {
			'Authorization': f"App {config('APP_KEY', default='app-insecure-qmdr&-k$vi)z$6mo%$f$td!qn_!_*-xhx864fa@qo55*c+mc&z')}"
		}
		game_results = requests.get(url, headers=headers)
		game_results = game_results.json()
		len = game_results.__len__()
		winner = game_results[len-1]
	return winner['user_id']

def eliminations(round: Round, pools: dict):
	"""
	Eliminate players from the tournament

	Args:
	- round: Round object
	- pools: Dictionary of pools with their data
	"""
	print("Eliminations")
	room = round.tournament_id.room_id
	if round.round_number == 1:
		elim_per_pool = first_round_elimination(len(Occupy.objects.filter(room_id=room)), len(pools))
	else:
		elim_per_pool = other_round_eliminations(len(pools))
	print("❌ Elim per pool", elim_per_pool)
	for i, pool in enumerate(pools.values()):
		url = f"http://proxy/api/game/get_results/{pool['game_id']}"
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

def update_tournament(tournament_id):
	"""
	Update the tournament

	Args:
	- tournament_id: Tournament ID
	"""
	lock.acquire()
	try:
		tournament = Tournament.objects.get(id=tournament_id)
		if (tournament.current_round == 0):
			roundCreate(tournament_id)
		else:
			round = Round.objects.get(tournament_id=tournament, round_number=tournament.current_round)
			url = f"http://proxy/api/game/retrieve_round/{round.id}"
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
