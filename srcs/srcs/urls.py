"""
URL configuration for srcs project.

The `urlpatterns` list routes URLs to views. For more information please see:
	https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
	1. Add an import:  from my_app import views
	2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
	1. Add an import:  from other_app.views import Home
	2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
	1. Import the include() function: from django.urls import include, path
	2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from . import SPA_view, HTTP_404_view

urlpatterns = [
	path('admin/', admin.site.urls),
	path('api/user_management/', include('user_management.urls')),
	path('api/auth/', include('authentication.urls')),
	path('api/game/', include('game.urls')),
	path('api/rooms/', include ('rooms.urls')),
	path('api/notif/', include('notification.urls')),
	path('api/<path:_>', HTTP_404_view.HTTP_404View.as_view(), name='404'),
	path('', SPA_view.SPAView.as_view(), name='base'),
	path('<path:test>', SPA_view.SPAView.as_view(), name='base'),
]
