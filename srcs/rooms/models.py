from django.db import models
from django.utils import timezone
from user_management.models import Player

class Rooms(models.Model):
	room_id = models.AutoField(primary_key=True)
	date = models.DateField(default=timezone.now)
	roomMode = models.CharField(max_length=50)
	visibility = models.CharField(max_length=50)
	code = models.CharField(max_length=50)

	def __str__(self):
		return f"Room {self.room_id} has code {self.code}"

class Occupy(models.Model):
	room_id = models.ForeignKey(Rooms, on_delete=models.CASCADE)
	player_id = models.IntegerField()
	is_master = models.BooleanField(default=False)

	def __str__(self):
		return f"Room {self.room_id} occupied by {self.player_id}"

class Tournament(models.Model):
	room_id = models.ForeignKey(Rooms, on_delete=models.CASCADE)
	total_rounds = models.IntegerField()
	current_round = models.IntegerField()

	def __str__(self):
		return f"Tournament in Room {self.room_id}, {self.total_rounds} rounds"

class Round(models.Model):
	Tournament_id = models.ForeignKey(Tournament, on_delete=models.CASCADE)
	round_number = models.IntegerField()

	def __str__(self):
		return f"Round {self.round_number} in Tournament {self.Tournament_id}"