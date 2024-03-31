from django.urls import path
from . import views

urlpatterns = [
	path('/create_normal', views.create_normal, name='create_normal'),
	path('/create_tournament', views.create_tournament, name='create_tournament'),
]