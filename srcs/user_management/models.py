# models.py

# from click import Group
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class Player(AbstractUser):
	id = models.AutoField(primary_key=True)
	groups = models.ManyToManyField('auth.Group', verbose_name=_('groups'), blank=True, related_name='custom_users')
	user_permissions = models.ManyToManyField('auth.Permission', verbose_name=_('user permissions'), blank=True, related_name='custom_users')
	
	avatar_file = models.CharField(max_length=255, blank=True, null=True)
	global_score = models.IntegerField(default=0)

class BeFriends(models.Model):
	user1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='user1')
	user2 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='user2')
	created_at = models.DateTimeField(auto_now_add=True)
