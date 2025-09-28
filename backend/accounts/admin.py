# backend/admin.py
from django.contrib import admin
from .models import CustomUser, Team  # Import from accounts app
from django.contrib.auth.admin import UserAdmin
from accounts.permissions import IsEventOrganizer
from rest_framework import generics, status
from .serializers import EventSerializer
from rest_framework.permissions import IsAuthenticated
from events.models import Event

class CustomUserAdmin(UserAdmin):
    # Add custom fields to the admin interface
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'name')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'name')}),
    )
    list_display = ['username', 'email', 'name', 'role', 'is_active', 'date_joined']
    list_filter = UserAdmin.list_filter + ('role',)

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Team)

class AdminEventListView(generics.ListAPIView):
    """Admin view to see all events regardless of approval status"""
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == 'admin':
            # Admins see everything
            return Event.objects.all().order_by('-id')
        elif user.role == 'event_organizer':
            # Event organizers see only their own events (all statuses)
            return Event.objects.filter(organizer=user).order_by('-id')
        else:
            # Regular users see only approved events
            return Event.objects.filter(is_approved=True).order_by('-id')