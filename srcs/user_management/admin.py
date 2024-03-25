# admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from user_management.models import CustomUser

admin.site.register(CustomUser, UserAdmin)
