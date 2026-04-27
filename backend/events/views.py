# backend/events/views.py - FIXED: Allow unauthenticated access to event details

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied, NotFound
from django.contrib.auth import get_user_model
from .models import Event, EventTeamStanding
from django.db.models import Q
from .serializers import EventSerializer, StandingSerializer, StandingUpdateItemSerializer
from enroll.models import TeamEnroll
from datetime import date

class EventCreateView(generics.CreateAPIView):
    """Create new event - requires authentication"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]


class EventListView(generics.ListAPIView):
    """Public event list - approved events, newest/recent first. Use ?upcoming_only=1 for upcoming only."""
    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Event.objects.filter(approval_status='approved').select_related(
            'organizer',
            'approved_by'
        ).prefetch_related(
            'enrollments'
        ).order_by('-date')  # recent first (newest / upcoming first)
        if self.request.GET.get('upcoming_only') == '1':
            today = date.today()
            qs = qs.filter(date__gte=today)
        return qs


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    ✅ FIXED: Event detail endpoint - allows public viewing
    - GET: Anyone can view approved upcoming events
    - PUT/DELETE: Only organizer or admin
    """
    serializer_class = EventSerializer
    permission_classes = [AllowAny]  # ✅ CHANGED: Allow unauthenticated GET
    
    def get_queryset(self):
        """
        ✅ FIXED: Determine what events to show based on method and user
        """
        user = self.request.user
        today = date.today()
        
        # For GET requests (retrieve) - show all approved events (upcoming + past)
        if self.request.method == 'GET':
            return Event.objects.filter(
                approval_status='approved'
            ).select_related(
                'organizer',
                'approved_by'
            ).prefetch_related(
                'enrollments'
            )
        
        # For PUT/DELETE - authentication required
        if not user.is_authenticated:
            return Event.objects.none()
        
        # For authenticated users (PUT/DELETE)
        if user.role == 'event_organizer':
            # Organizers can modify their own events (all, including past)
            return Event.objects.filter(organizer=user)
        
        # Admins can modify all events
        if user.is_superuser or (hasattr(user, 'role') and user.role == 'admin'):
            return Event.objects.all()
        
        # Others can't modify
        return Event.objects.none()

    def perform_update(self, serializer):
        """✅ FIXED: Only organizer or admin can update"""
        user = self.request.user
        instance = self.get_object()
        
        if not user.is_authenticated:
            raise PermissionDenied("Authentication required to update event")
        
        if instance.organizer != user and not (user.is_superuser or (hasattr(user, 'role') and user.role == 'admin')):
            raise PermissionDenied("You are not authorized to update this event")
        
        serializer.save()

    def perform_destroy(self, instance):
        """✅ FIXED: Only organizer or admin can delete"""
        user = self.request.user
        
        if not user.is_authenticated:
            raise PermissionDenied("Authentication required to delete event")
        
        if instance.organizer != user and not (user.is_superuser or (hasattr(user, 'role') and user.role == 'admin')):
            raise PermissionDenied("You are not authorized to delete this event")
        
        instance.delete()


class OrganizerEventsView(generics.ListAPIView):
    """Organizer's own events - shows all including past"""
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer
    
    def get_queryset(self):
        user = self.request.user
        system_user = get_user_model().objects.filter(username='system_user').first()
        today = date.today()
        
        if user.is_authenticated and user.role == 'event_organizer':
            # Organizers see ALL their own events (including past) 
            # + only upcoming system events
            return Event.objects.filter(
                Q(organizer=user) | 
                Q(organizer=system_user, approval_status='approved', date__gte=today)
            ).select_related(
                'organizer',
                'approved_by'
            ).prefetch_related(
                'enrollments'
            ).order_by('-id')
            
        elif user.is_authenticated:
            # Other authenticated users see only approved, upcoming system events
            return Event.objects.filter(
                organizer=system_user,
                approval_status='approved',
                date__gte=today
            ).select_related(
                'organizer',
                'approved_by'
            ).prefetch_related(
                'enrollments'
            ).order_by('-id')
            
        else:
            # Unauthenticated users see only approved, upcoming system events
            return Event.objects.filter(
                organizer=system_user,
                approval_status='approved',
                date__gte=today
            ).select_related(
                'organizer',
                'approved_by'
            ).prefetch_related(
                'enrollments'
            ).order_by('-id')


class EventStandingsView(APIView):
    """GET: public standings. POST: organizer/admin bulk update W, L, PF, PA."""
    permission_classes = [AllowAny]

    def get_event(self, event_id):
        event = Event.objects.filter(approval_status='approved', id=event_id).select_related('organizer').first()
        if not event:
            raise NotFound("Event not found")
        return event

    def get(self, request, event_id):
        """Return one row per enrolled team (public). Teams without stats show 0 for W/L/PF/PA."""
        event = self.get_event(event_id)
        enrollments = list(event.enrollments.all().order_by('id'))
        standings_by_enrollment = {
            s.team_enrollment_id: s
            for s in event.standings.select_related('team_enrollment').all()
        }
        rows = []
        for enrollment in enrollments:
            standing = standings_by_enrollment.get(enrollment.id)
            if standing:
                data = StandingSerializer(standing).data
                rows.append((data, standing.wins, standing.points_for - standing.points_against))
            else:
                data = {
                    'id': None,
                    'team_enrollment_id': enrollment.id,
                    'team_name': enrollment.team_name,
                    'wins': 0,
                    'losses': 0,
                    'points_for': 0,
                    'points_against': 0,
                    'points_diff': 0,
                }
                rows.append((data, 0, 0))
        rows.sort(key=lambda r: (-r[1], -r[2]))  # by wins, then point diff
        out = []
        for rank, (data, _w, _pd) in enumerate(rows, 1):
            data['rank'] = rank
            out.append(data)
        return Response(out)

    def post(self, request, event_id):
        if not request.user.is_authenticated:
            raise PermissionDenied("Authentication required")
        user = request.user
        event = Event.objects.filter(id=event_id).select_related('organizer').first()
        if not event:
            raise NotFound("Event not found")
        if event.organizer != user and not (user.is_superuser or (hasattr(user, 'role') and user.role == 'admin')):
            raise PermissionDenied("Only the event organizer or admin can update standings")
        payload = request.data.get('standings', [])
        if not isinstance(payload, list):
            return Response({'error': 'standings must be a list'}, status=status.HTTP_400_BAD_REQUEST)
        enrolled_ids = set(event.enrollments.values_list('id', flat=True))
        for item in payload:
            ser = StandingUpdateItemSerializer(data=item)
            if not ser.is_valid():
                return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
            tid = ser.validated_data['team_enrollment_id']
            if tid not in enrolled_ids:
                return Response({'error': f'team_enrollment_id {tid} is not enrolled'}, status=status.HTTP_400_BAD_REQUEST)
            EventTeamStanding.objects.update_or_create(
                event=event,
                team_enrollment_id=tid,
                defaults={
                    'wins': ser.validated_data['wins'],
                    'losses': ser.validated_data['losses'],
                    'points_for': ser.validated_data['points_for'],
                    'points_against': ser.validated_data['points_against'],
                },
            )
        qs = list(event.standings.select_related('team_enrollment').all())
        qs.sort(key=lambda s: (-s.wins, -(s.points_for - s.points_against)))
        out = []
        for rank, standing in enumerate(qs, 1):
            data = StandingSerializer(standing).data
            data['rank'] = rank
            out.append(data)
        return Response(out)