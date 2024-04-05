from django.urls import path
from . import views

urlpatterns = [
	path('me', views.me, name='me'),
	path('test', views.test, name='test'),
	path("edit_profile", views.edit_profile, name="edit_profile"),
	path("user/id/<int:id>", views.user_id, name="user"),
	path("user/<str:username>", views.user_username, name="user"), # TODO: change to /user/username/<str:username>
	path("friends/<str:username>", views.friends, name="friends"),
	path("add_friend/<str:username>", views.add_friend, name="add_friend"),
	path("remove_friend/<str:username>", views.remove_friend, name="remove_friend"),
]
