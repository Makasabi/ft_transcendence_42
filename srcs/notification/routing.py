# from django.urls import re_path
# from . import consumers

# websocket_urlpatterns = [
#     re_path(r"ws/notify/", consumers.NotificationConsumer.as_asgi()),
# ]

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path
from notification.consumers import NotificationConsumer
from notification.middleware import WebSocketAuthMiddleware
from django.core.asgi import get_asgi_application
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
	# path('ws/notifications/', NotificationConsumer.as_asgi()),
    re_path(r"ws/notify/", consumers.NotificationConsumer.as_asgi()),
    
]

# application = ProtocolTypeRouter({
# 	'http': get_asgi_application(),
# 	'websocket': AllowedHostsOriginValidator(
# 		WebSocketAuthMiddleware(
# 			URLRouter(
# 				websocket_urlpatterns
# 			)
# 		)
# 	),
# })