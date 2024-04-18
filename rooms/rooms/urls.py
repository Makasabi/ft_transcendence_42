from django.urls import path

from . import views_rooms, views_tournament, view_utils
from . import views_tournament

urlpatterns = [
	path('api/rooms/create_room', views_rooms.create_room, name='create_room'),
	path('api/rooms/get_code/<int:room_id>', views_rooms.get_code, name='get_code'),
	path("api/rooms/code/<str:roomCode>", views_rooms.roomCode, name='roomCode'),
	path("api/rooms/info/<str:roomCode>", views_rooms.roomInfo, name='roomInfo'),
	path("api/rooms/<int:room_id>/players", views_rooms.roomPlayers, name='roomPlayers'),
	path('api/rooms/get_round_code/<int:round_id>', views_tournament.get_round_code, name='get_round_code'),
	path("api/rooms/create_tournament/<int:roomId>", views_tournament.create_tournament, name="create_tournament"),
	path("api/rooms/info_tournament/<int:room_id>", views_tournament.tournamentInfo, name="info_tournament"),
	path("api/rooms/info_round/<int:tournament_id>/<int:round_number>", views_tournament.roundInfo, name="info_round"),
	path("api/rooms/round_start_time/<int:tournament_id>/<int:round_number>", views_tournament.round_start_time, name="round_start_time"),
	path("api/rooms/tournament_access/<int:tournament_id>/<int:user_id>", views_tournament.tournament_access, name="tournament_access"),
	path("api/rooms/check_tournament_status/<int:tournament_id>", views_tournament.check_tournament_status, name="check_tournament_status"),
]