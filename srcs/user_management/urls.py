from django.urls import path
from . import views

urlpatterns = [
	path('me', views.me, name='me'),
	path('test', views.test, name='test'),
	path("edit_profile", views.edit_profile, name="edit_profile"),
	path("get_friends", views.get_friends, name="get_friends"),
	path("user/id/<int:id>", views.user_id, name="user"),
	path("user/<str:username>", views.user_username, name="user"), # TODO: change to /user/username/<str:username>
	path("user/search/<str:username>", views.user_search, name="user_search"),
	path("friends/<str:username>", views.is_friend, name="is_friend"),
	path("add_friend/<str:username>", views.add_friend, name="add_friend"),
	path("remove_friend/<str:username>", views.remove_friend, name="remove_friend"),
	path('', views.me, name='me'),
]
