# game/models.py

from django.db import models
from django.utils import timezone

class Game(models.Model):
	game_id = models.AutoField(primary_key=True)
	parent_id = models.IntegerField(default=-1)
	mode = models.CharField(max_length=50, default='Normal')
	visibility = models.CharField(max_length=50, default='Public')
	date_begin = models.DateField(default=timezone.now)
	date_end = models.DateField(null=True)
	end_status = models.CharField(max_length=50, null=True)
	ongoing = models.BooleanField(default=False)

	def __str__(self):
		return f"{self.game_id}"

class Play(models.Model):
	game = models.ForeignKey(Game, on_delete=models.CASCADE)  # Add the game field
	user_id = models.IntegerField(default=0)
	score = models.IntegerField(default=-1)

	def __str__(self):
		return f"Game id : {self.game}  User id : {self.user_id}"

	class Meta:
		unique_together = ('game', 'user_id',)
