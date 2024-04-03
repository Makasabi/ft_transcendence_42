from django.urls import path
from . import views

urlpatterns = [
	path('', views.index, name='game_index'),
	path('start/<int:room_id>', views.start, name='game_start'),
]
