from django.db import models
from django.utils import timezone

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
	total_rounds = models.IntegerField(default=0)
	current_round = models.IntegerField(default=0)

	def __str__(self):
		return f"Tournament {self.id} in {self.room_id}, and total {self.total_rounds} rounds"

class Round(models.Model):
	tournament_id = models.ForeignKey(Tournament, on_delete=models.CASCADE)
	round_number = models.IntegerField()
	date_start = models.DateTimeField(max_length=100)
	ready_to_play = models.BooleanField(default=False)

	def __str__(self):
		return f"{self.id} is round {self.round_number} in {self.tournament_id}"