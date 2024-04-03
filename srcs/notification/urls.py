from django.urls import path
from . import views

urlpatterns = [
	path("create_notif/<str:type>/<str:target>", views.create_notif, name="create_notif"),
	path("get_notifs", views.get_notifs, name="get_notifs"),
	path('', views.index, name='index'),
]