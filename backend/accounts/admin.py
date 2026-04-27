# backend/accounts/admin.py
from django.contrib import admin
from .models import CustomUser, Team
from django.contrib.auth.admin import UserAdmin
from accounts.permissions import IsEventOrganizer
from rest_framework import generics, status
from .serializers import EventSerializer
from rest_framework.permissions import IsAuthenticated
from events.models import Event

class CustomUserAdmin(UserAdmin):
    # ✨ UPDATED: Add email verification fields to the admin interface
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'name')}),
        ('Email Verification', {'fields': ('is_email_verified', 'email_verification_token', 'email_verification_sent_at')}),  # ✨ NEW
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'name')}),
    )
    
    # ✨ UPDATED: Add email verification status to list display
    list_display = ['username', 'email', 'name', 'role', 'is_active', 'is_email_verified', 'date_joined']
    list_filter = UserAdmin.list_filter + ('role', 'is_email_verified')  # ✨ Added filter
    
    # ✨ NEW: Make verification fields readonly in admin
    readonly_fields = ['email_verification_token', 'email_verification_sent_at']

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Team)

class AdminEventListView(generics.ListAPIView):
    """Admin view to see all events regardless of approval status"""
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == 'admin':
            return Event.objects.all().order_by('-id')
        elif user.role == 'event_organizer':
            return Event.objects.filter(organizer=user).order_by('-id')
        else:
            return Event.objects.filter(is_approved=True).order_by('-id')