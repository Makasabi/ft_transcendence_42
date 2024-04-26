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
		return f"Id {self.game_id} is a {self.mode} game started by {self.parent_id}"

class LocalGame(Game):
	player1_name = models.CharField(max_length=50, null=True)
	player2_name = models.CharField(max_length=50, null=True)
	player1_has_win = models.BooleanField(null=True)
	score = models.IntegerField(default=-1)

	def __str__(self):
		return f"Local game id : {self.game_id}  Player 1 : {self.player1_id}  Player 2 : {self.player2_id}"

class Test(models.Model):
	test_id = models.AutoField(primary_key=True)
	test_name = models.CharField(max_length=50, default='Test')
	test_date = models.DateField(default=timezone.now)

	def __str__(self):
		return f"Test id : {self.test_id}  Name : {self.test_name}"

class Play(models.Model):
	game = models.ForeignKey(Game, on_delete=models.CASCADE)  # Add the game field
	user_id = models.IntegerField(default=0)
	score = models.IntegerField(default=-1)

	def __str__(self):
		return f"Game id : {self.game}  User id : {self.user_id}"

	class Meta:
		unique_together = ('game', 'user_id',)
