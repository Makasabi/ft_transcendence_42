from django.contrib import admin

# Register your models here.
from .models import Rooms, Occupy

# 👇 2. Add this line to add the notification
admin.site.register(Rooms)
admin.site.register(Occupy)