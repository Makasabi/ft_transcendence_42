# game/models.py

from django.db import models
from django.utils import timezone
from user_management.models import Player

class Game(models.Model):
	game_id = models.AutoField(primary_key=True)
	room_id = models.IntegerField(default=-1)
	mode = models.CharField(max_length=50, default='Normal')
	visibility = models.CharField(max_length=50, default='Public')
	date_begin = models.DateField(default=timezone.now)
	date_end = models.DateField(null=True)
	end_status = models.CharField(max_length=50, null=True)

class Play(models.Model):
	game = models.ForeignKey(Game, on_delete=models.CASCADE)  # Add the game field
	user_id = models.IntegerField(default=0)
	score = models.IntegerField(default=0)
