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
	online = models.BooleanField(default=False)
	doubleFA = models.BooleanField(default=False)

	otpauth_url = models.CharField(max_length=225, blank=True, null=True)
	otp_base32 = models.CharField(max_length=255, null=True)
	qr_code = models.ImageField(upload_to="qrcode/",blank=True, null=True)
	login_otp = models.CharField(max_length=255, null=True, blank=True)
	login_otp_used = models.BooleanField(default=True)
	otp_created_at = models.DateTimeField(blank=True, null=True)

class BeFriends(models.Model):
	user1 = models.IntegerField()
	user2 = models.IntegerField()
	created_at = models.DateTimeField(auto_now_add=True)
