# game_management/models.py

from django.db import models
from django.utils import timezone
from user_management.models import CustomUser

class Game(models.Model):
	game_id = models.AutoField(primary_key=True)
	date = models.DateField(default=timezone.now)

class GameScore(models.Model):
	score = models.IntegerField(default=0)
	users = models.ManyToManyField(CustomUser)
	game = models.ForeignKey(Game, on_delete=models.CASCADE)  # Add the game field
