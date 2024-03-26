from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from . import views

urlpatterns = [
	path("", views.check_token, name="check_token"),
	path("login/", views.login, name="login"),
	path("signup/", views.signup, name="signup"),
]
