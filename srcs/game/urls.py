from django.urls import path
from . import views

urlpatterns = [
	path('', views.index, name='game_index'),
	path('start/<int:room_id>', views.start, name='game_start'),
	path('get_players/<int:game_id>', views.get_players, name='get_players'),
]
