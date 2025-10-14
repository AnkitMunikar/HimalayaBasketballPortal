# backend/events/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
from .models import Event
from django.db.models import Q
from .serializers import EventSerializer
from datetime import date  # Add this import

class EventCreateView(generics.CreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer


class EventListView(generics.ListAPIView):
    """Public event list - only shows approved and upcoming events"""
    serializer_class = EventSerializer
    
    def get_queryset(self):
        today = date.today()  # KEY CHANGE: Add date filter
        return Event.objects.filter(
            is_approved=True,
            date__gte=today  # Only upcoming events
        ).order_by('-id')


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        today = date.today()
        
        if user.role == 'event_organizer':
            # Organizers see their own events (including past for management)
            return Event.objects.filter(organizer=user)
        else:
            # Others only see approved, upcoming events
            return Event.objects.filter(
                is_approved=True,
                date__gte=today
            )

    def perform_destroy(self, instance):
        if instance.organizer != self.request.user:
            raise PermissionDenied("You are not authorized to delete this event.")
        instance.delete()


class OrganizerEventsView(generics.ListAPIView):
    """Organizer's own events - shows all including past"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        return EventSerializer

    def get_queryset(self):
        user = self.request.user
        system_user = get_user_model().objects.filter(username='system_user').first()
        today = date.today()  # Add date filter
        
        if user.is_authenticated and user.role == 'event_organizer':
            # Organizers see ALL their own events (including past) 
            # + only upcoming system events
            return Event.objects.filter(
                Q(organizer=user) | 
                Q(organizer=system_user, is_approved=True, date__gte=today)
            ).order_by('-id')
            
        elif user.is_authenticated:
            # Other users see only approved, upcoming system events
            return Event.objects.filter(
                organizer=system_user,
                is_approved=True,
                date__gte=today
            ).order_by('-id')
            
        else:
            # Unauthenticated users see only approved, upcoming system events
            return Event.objects.filter(
                organizer=system_user,
                is_approved=True,
                date__gte=today
            ).order_by('-id')