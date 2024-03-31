from django.urls import path
from . import views

urlpatterns = [
	path('/create/normal', views.create_normal, name='create_normal'),
	path('/create/tournament', views.create_tournament, name='create_tournament'),
]