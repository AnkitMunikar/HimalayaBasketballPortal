from django.contrib import admin
from .models import Event  # Import your Event model

admin.site.register(Event)  # Register it so it appears in the admin
