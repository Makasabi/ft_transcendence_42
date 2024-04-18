"""
ASGI config for srcs project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter, ChannelNameRouter
from rooms.TokenAuthenticationMiddleware import TokenAuthMiddleware
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path
from rooms.consumers import RoomConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

application = ProtocolTypeRouter({
	"http": get_asgi_application(),
	"websocket": TokenAuthMiddleware(
		AllowedHostsOriginValidator(
			URLRouter([
				path('ws/rooms/<int:room_id>', RoomConsumer.as_asgi()),
			])
		)
	),
})
