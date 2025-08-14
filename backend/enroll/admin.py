from django.contrib import admin
from .models import TeamEnroll, Player

admin.site.register(TeamEnroll)  # Register it so it appears in the admin
admin.site.register(Player)  # Register it so it appears in the admin
