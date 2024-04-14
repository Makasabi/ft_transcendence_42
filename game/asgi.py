"""
ASGI config for srcs project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter, ChannelNameRouter
from game.TokenAuthenticationMiddleware import TokenAuthMiddleware
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path
from game.player_consumer import PlayerConsumer
from game.game_consumer import GameConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

application = ProtocolTypeRouter({
	"http": get_asgi_application(),
	"websocket": TokenAuthMiddleware(
		AllowedHostsOriginValidator(
			URLRouter([
				path('ws/game/<int:game_id>', PlayerConsumer.as_asgi()),
			])
		)
	),
	"channel": ChannelNameRouter({
		"game_consumer": GameConsumer.as_asgi(),
	}),
})
