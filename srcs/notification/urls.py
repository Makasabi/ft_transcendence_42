from django.urls import path
from . import views

urlpatterns = [
	path("create_notif/<str:type>/<str:target>", views.create_notif, name="create_notif"),
	path("delete_notif/<int:id>", views.delete_notif, name="delete_notif"),
	path("get_notifs/<str:type>", views.get_notifs, name="get_notifs"),
	path("set_seen", views.set_seen, name="set_seen"),
	# path('', views.index, name='index'),
]
