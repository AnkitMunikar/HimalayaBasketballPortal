from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
from .models import Event
from django.db.models import Q
from .serializers import EventSerializer

class EventCreateView(generics.CreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

class EventListView(generics.ListAPIView):
    """Public event list - only shows approved events"""
    serializer_class = EventSerializer
    
    def get_queryset(self):
        # Only show approved events to public
        return Event.objects.filter(is_approved=True).order_by('-id')

class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'event_organizer':
            # Organizers can see their own events regardless of approval status
            return Event.objects.filter(organizer=user)
        else:
            # Others can only see approved events
            return Event.objects.filter(is_approved=True)

    def perform_destroy(self, instance):
        if instance.organizer != self.request.user:
            raise PermissionDenied("You are not authorized to delete this event.")
        instance.delete()

class OrganizerEventsView(generics.ListAPIView):
    """Organizer's own events - shows all (approved and pending)"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        return EventSerializer

    def get_queryset(self):
        user = self.request.user
        system_user = get_user_model().objects.filter(username='system_user').first()
        
        if user.is_authenticated and user.role == 'event_organizer':
            # Organizers see their own events (all statuses) + system events (approved only)
            return Event.objects.filter(
                Q(organizer=user) | 
                Q(organizer=system_user, is_approved=True)
            ).order_by('-id')
        elif user.is_authenticated:
            # Other authenticated users see only approved system events
            return Event.objects.filter(organizer=system_user, is_approved=True).order_by('-id')
        else:
            # Unauthenticated users see only approved system events
            return Event.objects.filter(organizer=system_user, is_approved=True).order_by('-id')