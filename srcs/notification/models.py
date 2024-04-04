from django.db import models
from django.utils import timezone
from user_management.models import Player


class Notification(models.Model):

	notif_id = models.AutoField(primary_key=True)
	type = models.CharField(max_length=100)
	date = models.DateField(default=timezone.now)
	is_seen = models.BooleanField(default=False)

	# different types :
	# - friend_request
	# - friend_request_accepted
	# - friend_removal (?)
	# - friend_request_rejected (?)

	# - game_invitation
	# - game_invitation_accepted (?)

	# - game_winner
	# - tournament_winner

	# - number_one
	# - game_down

	def __str__(self):
		return self.type


class UserNotifies(models.Model):
	user_id = models.IntegerField(default=0)
	notif = models.ForeignKey(Notification, on_delete=models.CASCADE)

class IsNotified(models.Model):
	user_id = models.IntegerField(default=0)
	notif = models.ForeignKey(Notification, on_delete=models.CASCADE)

class RoomNotifies(models.Model):
	room_id = models.IntegerField(default=0)
	notif = models.ForeignKey(Notification, on_delete=models.CASCADE)
