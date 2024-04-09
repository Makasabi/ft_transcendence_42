from django.urls import re_path

from . import consumers

ws_urlpatterns = [
    re_path(r"ws/game_test/", consumers.RPSConsumer.as_asgi()),
]
