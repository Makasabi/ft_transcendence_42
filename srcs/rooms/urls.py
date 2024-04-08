from django.urls import path

from . import views

urlpatterns = [
	path('create_room', views.create_room, name='create_room'),
	path("code/<str:roomCode>", views.roomCode, name='roomCode'),
	path("info/<str:roomCode>", views.roomInfo, name='roomCode'),
	path("<int:room_id>/players", views.roomPlayers, name='roomPlayers'),
]