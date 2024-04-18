from django.contrib import admin

# Register your models here.
from .models import Rooms, Occupy, Tournament, Round

# 👇 2. Add this line to add the notification
admin.site.register(Rooms)
admin.site.register(Occupy)
admin.site.register(Tournament)
admin.site.register(Round)