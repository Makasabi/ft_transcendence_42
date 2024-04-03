from django.urls import path
from . import views

urlpatterns = [
	path('me', views.me, name='me'),
	path('test', views.test, name='test'),
	path("edit_profile", views.edit_profile, name="edit_profile"),
	path("user/<str:username>", views.user, name="user"),
	path("friends/<str:username>", views.friends, name="friends"),
	path("add_friend/<str:username>", views.add_friend, name="add_friend"),
	path("remove_friend/<str:username>", views.remove_friend, name="remove_friend"),
]
