from django.urls import path
from . import views

urlpatterns = [
	path('', views.index, name='game_index'),
	path('api/game/start/<int:room_id>', views.start, name='game_start'),
	path('api/game/get_players/<int:game_id>', views.get_players, name='get_players'),
	path('api/game/get_history/<int:player_id>', views.get_history, name='get_history'),
	path('api/game/<int:game_id>/room_code', views.get_roomcode, name='get_roomcode'),
]
