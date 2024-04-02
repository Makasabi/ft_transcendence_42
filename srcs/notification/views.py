from django.shortcuts import render
from django.http import JsonResponse
from user_management.models import Player, BeFriends
from game.models import Play
from rest_framework.decorators import api_view
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.http import JsonResponse
from rest_framework.decorators import api_view
from notification.models import Notification

# Create your views here.
def index(request):
	return render(request, 'index.html')

@api_view(['POST'])
def notif_add_friend(request, username):
	"""
	Notify the 'friend' user that 'username' added them as friend
	"""
	user1 = request.user.username
	print(f'{user1} added {username} as friend')
	# Create new Notification
	Notification.objects.create(message=f'{user1} added you as friend')

	# Send notification to group (only user will receive it)
	channel_layer = get_channel_layer()
	async_to_sync(channel_layer.group_send)(
		'notif_group',
		{
			'type': 'send_notification',
			'user': username,
			'message': f'{user1} added {username} as friend'
		}
	)
	return JsonResponse({'message': 'Notification sent'})


@api_view(['POST'])
def notif_remove_friend(request, username):
	"""
	Notify the 'friend' user that 'username' added them as friend
	"""
	user1 = request.user.username
	print(f'{user1} added {username} as friend')
	# Create new Notification
	Notification.objects.create(message=f'{user1} is no longer your friend :(')

	# Send notification to group (only user will receive it)
	channel_layer = get_channel_layer()
	async_to_sync(channel_layer.group_send)(
		'notif_group',
		{
			'type': 'send_notification',
			'user': username,
			'message': f'{user1} removed {username} as friend'
		}
	)
	return JsonResponse({'message': 'Notification sent'})