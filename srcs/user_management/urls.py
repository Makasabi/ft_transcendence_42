from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
	path('me', views.me, name='me'),
	path('me_id', views.me_id, name='me_id'),
	path("edit_profile", views.edit_profile, name="edit_profile"),
	path("upload_avatar", views.upload_avatar, name="upload_avatar"),
	path("user/username/<str:username>", views.user_username, name="user"),
	path("user/id/<int:id>", views.user_id, name="user"),
	path("user/search/<str:username>", views.user_search, name="user_search"),
	path("get_friends", views.get_friends, name="get_friends"),
	path("friends/<int:user_id>", views.is_friend, name="is_friend"),
	path("add_friend/<int:user_id>", views.add_friend, name="add_friend"),
	path("remove_friend/<int:user_id>", views.remove_friend, name="remove_friend"),
	path('', views.me, name='me'),
]
