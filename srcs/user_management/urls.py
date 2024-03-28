from django.urls import path
from . import views

urlpatterns = [
	path('me', views.me, name='me'),
	path('test', views.test, name='test'),
	path("edit_profile", views.edit_profile, name="edit_profile"),
]
