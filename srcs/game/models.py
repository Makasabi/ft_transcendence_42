# game/models.py

from django.db import models
from django.utils import timezone
from user_management.models import Player

class Game(models.Model):
	game_id = models.AutoField(primary_key=True)
	mode = models.CharField(max_length=50)
	visibility = models.CharField(max_length=50)
	date = models.DateField(default=timezone.now)

class Play(models.Model):
	game = models.ForeignKey(Game, on_delete=models.CASCADE)  # Add the game field
	user_id = models.IntegerField(default=0)
	score = models.IntegerField(default=0)
