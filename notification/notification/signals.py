from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification

@receiver(post_save, sender=Notification)
def notification_created(sender, instance, created, **kwargs):
	if created:
		print('Notification was created in DB')
		# channel_layer = get_channel_layer()
		# async_to_sync(channel_layer.group_send)(
		# 	'notif_group',
		# 	{
		# 		'type': 'send_notification',
		# 		'user': 'wansomeone',
		# 		'message': instance.message
		# 	}
		# )
		# print('Notification sent to group notif_group')
