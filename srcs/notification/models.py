from django.db import models
from django.utils import timezone

class Notification(models.Model):
	message = models.CharField(max_length=100)
	date = models.DateField(default=timezone.now)
	is_read = models.BooleanField(default=False)

	def __str__(self):
		return self.message