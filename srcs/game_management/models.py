# game_management/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Game(models.Model):
    game_id = models.AutoField(primary_key=True)
    date = models.DateField(default=timezone.now)

class GameScore(models.Model):
    score = models.IntegerField(default=0)
    users = models.ManyToManyField(User)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)  # Add the game field

# class UserGameScore(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     game_score = models.ForeignKey(GameScore, on_delete=models.CASCADE)

class GameUserScore(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=None)
    game_score = models.ForeignKey(GameScore, on_delete=models.CASCADE, default=None)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, default=None)
    score = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'game')
