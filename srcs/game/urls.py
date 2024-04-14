from django.urls import path
from . import views

urlpatterns = [
	path('', views.index, name='game_index'),
	path('start/<int:room_id>', views.start, name='game_start'),
	path('get_players/<int:game_id>', views.get_players, name='get_players'),
	path('get_history/<int:player_id>', views.get_history, name='get_history'),
	path('<int:game_id>/room_code', views.get_roomcode, name='get_roomcode'),
]
