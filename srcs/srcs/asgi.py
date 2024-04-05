"""
ASGI config for srcs project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter, ChannelNameRouter
from notification.middleware import WebSocketAuthMiddleware
from .TokenAuthenticationMiddleware import TokenAuthMiddleware
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path
from notification.consumers import NotificationConsumer
from game.player_consumer import PlayerConsumer
from game.game_consumer import GameConsumer
from rooms.consumers import RoomConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'srcs.settings')

application = ProtocolTypeRouter({
	"http": get_asgi_application(),
	"websocket": TokenAuthMiddleware(
		AllowedHostsOriginValidator(
			URLRouter([
				path('ws/notif/<str:username>', NotificationConsumer.as_asgi()),
				path('ws/room/<int:room_id>', RoomConsumer.as_asgi()),
				path('ws/game/<int:game_id>', PlayerConsumer.as_asgi()),
			])
		)
	),
	"channel": ChannelNameRouter({
		"game_consumer": GameConsumer.as_asgi(),
	}),
})
