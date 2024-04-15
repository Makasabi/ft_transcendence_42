from django.urls import path
from . import views

urlpatterns = [
	path('', views.index, name='game_index'),
	path('start/<int:room_id>', views.start, name='game_start'),
	path('create_pool/<int:round_id>', views.create_pool, name='create_pool'),
	path('retrieve_round/<int:round_id>', views.retrieve_round, name='retrieve_round'),
	path('get_players/<int:game_id>', views.get_players, name='get_players'),
	path('get_history/<int:player_id>', views.get_history, name='get_history'),
	path('get_game_started/<int:room_id>', views.get_game_started, name='get_game_started'),
	path('<int:game_id>/room_code', views.get_roomcode, name='get_roomcode'),
]
