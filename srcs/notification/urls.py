from django.urls import path
from . import views

urlpatterns = [
	# path("notif_add_friend/<str:username>", views.notif_add_friend, name="notif_add_friend"),
	path("create_notif/<str:type>/<str:target>", views.create_notif, name="create_notif"),
	# path("notif_remove_friend/<str:username>", views.notif_remove_friend, name="notif_remove_friend"),
	path("get_notifs/", views.get_notifs, name="get_notifs"),
	path('', views.index, name='index'),
]
