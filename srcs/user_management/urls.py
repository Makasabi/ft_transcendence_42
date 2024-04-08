from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
	path('me', views.me, name='me'),
	path('test', views.test, name='test'),
	path("edit_profile", views.edit_profile, name="edit_profile"),
	path("upload_avatar", views.upload_avatar, name="upload_avatar"),
	path("get_friends", views.get_friends, name="get_friends"),
	path("user/id/<int:id>", views.user_id, name="user"),
	path("user/<str:username>", views.user_username, name="user"), # TODO: change to /user/username/<str:username>
	path("friends/<int:user_id>", views.is_friend, name="is_friend"),
	path("add_friend/<int:user_id>", views.add_friend, name="add_friend"),
	path("remove_friend/<int:user_id>", views.remove_friend, name="remove_friend"),
	path('', views.me, name='me'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
