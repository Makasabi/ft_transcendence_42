from django.urls import path
from . import views

urlpatterns = [
	path("notif_add_friend/<str:username>", views.notif_add_friend, name="notif_add_friend"),
	path("notif_remove_friend/<str:username>", views.notif_remove_friend, name="notif_remove_friend"),
	path('', views.index, name='index'),
]
