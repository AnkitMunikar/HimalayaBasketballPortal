from django.contrib import admin
from .models import Event  # Only import Event from events app

admin.site.register(Event)