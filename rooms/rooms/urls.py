from django.urls import path

from . import views

urlpatterns = [
	path('create_room', views.create_room, name='create_room'),
	path('get_code/<int:room_id>', views.get_code, name='get_code'),
	path("code/<str:roomCode>", views.roomCode, name='roomCode'),
	path("info/<str:roomCode>", views.roomInfo, name='roomInfo'),
	path("<int:room_id>/players", views.roomPlayers, name='roomPlayers'),
	path("create_tournament/<int:roomId>", views.create_tournament, name="create_tournament"),
	path("info_tournament/<str:code>", views.tournamentInfo, name="info_tournament"),
]