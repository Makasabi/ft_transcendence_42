# fake_game_db_creation.py

import os
import sys
import random
import django

from pathlib import Path
sys.path.append(Path(__file__).resolve().parent.parent.__str__())

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'srcs.settings')

django.setup()

# from django.contrib.auth.models import CustomUser
from user_management.models import CustomUser
from game_management.models import Game, GameScore
from django.utils import timezone

def create_game(users):
	# Create a new game with the current date and time
	game = Game.objects.create(date=timezone.now())
	users_list = list(users)
	random.shuffle(users_list)
	num_players = random.randint(2, 6)
	unique_scores = random.sample(range(0, 6), num_players)

	# Create GameScore instances for each user in the game with random scores
	for user, score in zip(users_list[:num_players], unique_scores):
		print(f"Creating fake score for user {user.username}...")
		game_score = GameScore.objects.create(score=score, game=game)
		game_score.users.add(user)  # Add the user to the game score
	
	return game

if __name__ == "__main__":
	# Retrieve all users from the CustomUser database
	users = CustomUser.objects.all()

	print(f"Total users: {users.count()}")
	# Create fake games with random users and scores
	num_games = 5  # Adjust the number of fake games as needed
	print(f"Creating {num_games} fake games...")
	for _ in range(num_games):
		game = create_game(users)
		print(f"Fake game with {game.gamescore_set.count()} scores created successfully")  # Accessing the GameScore instances using the related name 'gamescore_set'
