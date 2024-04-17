from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
import random
import requests
import string
from decouple import config

from rooms.models import Rooms, Tournament, Occupy

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

	# iteration on each element of repartition (which is a list of pools)
	# repartition is a list of dictionaries with keys "places" and "players"
	# "places" is the number of places in the pool
	# "players" is a list of players in the pool
	# contestants_list is the list of all players in the room
 
	for i, pool_data in enumerate(repartition, 1):
		places = pool_data.get("places", 0)
		players = contestants_list[:places]
		for player in players:
			url = f"http://proxy/api/user_management/user/id/{player.player_id}"
			headers = {
				'Authorization': f"App {config('APP_KEY', default='app-insecure-qmdr&-k$vi)z$6mo%$f$td!qn_!_*-xhx864fa@qo55*c+mc&z')}"
			}
			data = requests.get(url, headers=headers)
			pool_data["players"].append(data.json())
		contestants_list = contestants_list[places:]
		distributed_contestants[f"pool_{i}"] = pool_data
	
	# create game for each pool and add players to the game

	# Uncomment to print the repartition
	# for pool in distributed_contestants:
	# 	print(f"Pool nb {pool}")
	# 	for player in distributed_contestants[pool]["players"]:
	# 		print(player)
	# 	print("\n")
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
	elim = nb_pool // 6
	rest = nb_pool % 6
	for i in range(nb_pool):
		elim_per_pool.append({'elim': elim + int(rest > 0)})
		if rest > 0:
			rest -= 1
	return elim_per_pool
