import os
import sys
import csv
import django
import random
from pathlib import Path

from django.contrib.auth import get_user_model

sys.path.append(Path(__file__).resolve().parent.parent.__str__())

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'srcs.settings')
django.setup()

from user_management.models import Player, BeFriends

def add_random_friendships():
	all_players = Player.objects.all()

	for player in all_players:
		num_friends = random.randint(8, 20)  # Choose a random number of friends for the player

		friends_to_add = random.sample(list(all_players.exclude(id=player.id)), min(num_friends, len(all_players)-1))

		for friend in friends_to_add:
			if not BeFriends.objects.filter(user1=player.id, user2=friend.id).exists():
				BeFriends.objects.create(user1=player.id, user2=friend.id)
				print(f'User "{player.username}" is now friends with "{friend.username}"')

if __name__ == "__main__":
	add_random_friendships()
