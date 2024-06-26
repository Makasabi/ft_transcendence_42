from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from . import views

urlpatterns = [
	path("", views.check_token, name="check_token"),
	path("login/", views.login, name="login"),
	path("signup/", views.signup, name="signup"),
	path("forty2_auth/", views.forty2_auth, name="forty2_auth"),
	path("get_42_mail/", views.get_42_mail, name="get_42_mail"),
	path("google_auth/", views.google_auth, name="google_auth"),
	path("is_registered/", views.is_registered, name="is_registered"),
	path("totp_create/", views.TOTPCreateView, name='totp-create'),
	path("totp_verify/", views.TOTPVerifyView, name='totp-verify'),
]
