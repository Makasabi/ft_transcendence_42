from django.shortcuts import render
from django.http import JsonResponse
from user_management.models import Player, BeFriends
from game.models import Play
from rest_framework.decorators import api_view
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.http import JsonResponse
from notification.models import Notification, UserNotifies, IsNotified
from notification.consumers import NotificationConsumer
import requests
 
# Create your views here.
def index(request):
	return render(request, 'index.html')

@api_view(['POST'])
def create_notif(request, type, target):
	"""
	Notify the 'target' user of the 'type' notification
	"""
	user1 = request.user

	# get target user infos
	url = f"http://localhost:8000/api/user_management/user/{target}"
	token = request.COOKIES.get('token')
	headers = {'Authorization': "Token " + token}
	target = requests.get(url, headers=headers)

	# Create new Notification
	create_send_notification(user1, target.json(), type)
	return JsonResponse({'message': 'Notification sent'})


@api_view(['GET'])
def get_notifs(request, type):
	"""
	Return all notifications for the user
	"""
	user_id = request.user.id
	notif_json = []
	if (type == 'unseen'):
		notifs = Notification.objects.filter(isnotified__user_id=user_id, isnotified__notif__is_seen=False)
	elif (type == 'all'):
		notifs = Notification.objects.filter(isnotified__user_id=user_id)
	for notif in notifs:
		notif_json.append({'type': notif.type, 'date': notif.date, 'message': notif.message, 'is_seen': notif.is_seen})
	return JsonResponse(notif_json, safe=False)


def create_send_notification(user, target, type):
	"""
	Create a new notification for a user
	"""
	message = build_message(user.username, type)
	notif = Notification.objects.create(type=type, message=message)

	UserNotifies.objects.create(user_id=user.id, notif=notif)
	IsNotified.objects.create(user_id=target['id'], notif=notif)

	# print(f'Notification created: {message}')
	channel_layer = get_channel_layer()
	async_to_sync(channel_layer.group_send)(
		'notif_group',
		{
			'type': 'send_notification',
			'user': target['username'],
			'message': message
		}
	)


def build_message(user, type):
	"""
	Build the message of the notification
	"""
	message = ''
	if type == 'friend_request':
		message = f'{user} added you as friend'
	elif type == 'friend_request_accepted':
		message = f'{user} accepted your friend request !'
	elif type == 'friend_removal':
		message = f'{user} is no longer your friend :('
	elif type == 'game_invitation':
		message = f'{user} invited you to play a game'
	elif type == 'game_winner':
		message = f'{user} won the game !'
	elif type == 'tournament_winner':
		message = f'{user} won the tournament'
	elif type == 'number_one':
		message = f'Congrats {user}, you are the number one !'
	# elif type == 'friend_removal':
	# 	message = f'{user} removed {target} as friend'
	# elif type == 'game_invitation_accepted':
	# 	message = f'{target} accepted {user}\'s game invitation'
	# elif type == 'game_down':
	# 	message = f'{user} is down'
	return message

@api_view(['POST'])
def set_seen(request):
	"""
	Set all notifications as seen
	"""
	notifs = IsNotified.objects.filter(user_id=request.user.id)
	# print(notifs)
	for notif in notifs:
		notif.notif.is_seen = True
		notif.notif.save()
	return JsonResponse({'message': 'Notification seen'})