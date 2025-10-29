# backend/enroll/views.py
from rest_framework import viewsets, generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsCoach, IsEventOrganizer
from .models import TeamEnroll, Player
from .serializers import EnrollSerializer, PlayerSerializer, PublicEnrollSerializer
from events.models import Event
from datetime import date
import logging

logger = logging.getLogger(__name__)

class EnrollViews(viewsets.ModelViewSet):
    serializer_class = EnrollSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        today = date.today()  # Add date filtering
        
        if not user.is_authenticated:
            return TeamEnroll.objects.none()
            
        if user.role == 'coach':
            # Coach sees their enrollments for upcoming events only
            return TeamEnroll.objects.filter(
                coach_name=user.name,
                event__date__gte=today
            ).select_related('event')
            
        elif user.role == 'event_organizer':
            # Organizer sees enrollments for their upcoming events
            return TeamEnroll.objects.filter(
                event__organizer=user,
                event__date__gte=today
            ).select_related('event')
            
        return TeamEnroll.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        logger.info(f"perform_create called for user: {user.username}, role: {user.role}")
        logger.info(f"Validated data: {serializer.validated_data}")
        
        if user.role == 'coach':
            logger.info(f"Coach {user.username} attempting to enroll team")
            coach_team = user.team_set.first()
            if not coach_team:
                logger.warning(f"Coach {user.username} has no team assigned")
                return Response(
                    {"detail": "No team assigned to this coach."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer.save(coach_name=user.name, team=coach_team)
            logger.info(f"Team enrollment created for coach {user.username}")
            
        elif user.role == 'event_organizer':
            logger.info(f"Event organizer {user.username} attempting to enroll team")
            serializer.save(coach_name=user.name)
            logger.info(f"Team enrollment created for organizer {user.username}")
            
        else:
            logger.warning(f"Unauthorized user {user.username} with role {user.role} attempted enrollment")
            return Response(
                {"detail": "Not authorized to create team enrollment."}, 
                status=status.HTTP_403_FORBIDDEN
            )

class PlayerViews(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    permission_classes = [IsAuthenticated, IsCoach]


class EventTeamsListView(generics.ListAPIView):
    """Public view - shows teams for approved, upcoming events"""
    serializer_class = PublicEnrollSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        event_id = self.kwargs['event_id']
        today = date.today()
        
        try:
            # Only show teams for approved, upcoming events
            event = Event.objects.get(
                id=event_id, 
                approval_status='approved',
                date__gte=today  # KEY CHANGE: Only upcoming events
            )
            return TeamEnroll.objects.filter(event=event).select_related('event', 'team')
        except Event.DoesNotExist:
            return TeamEnroll.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        if not queryset.exists():
            event_id = self.kwargs['event_id']
            try:
                event = Event.objects.get(id=event_id)
                
                # Check if event has passed
                if event.date < date.today():
                    return Response(
                        {"detail": "This event has concluded."}, 
                        status=status.HTTP_410_GONE
                    )
                    
                if event.approval_status == 'pending':
                    return Response(
                        {"detail": "This event is pending approval."}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                    
                if event.approval_status == 'rejected':
                    return Response(
                        {"detail": "This event has been rejected."}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                    
                return Response(
                    {"detail": "No teams enrolled for this event."}, 
                    status=status.HTTP_200_OK
                )
                
            except Event.DoesNotExist:
                return Response(
                    {"detail": "Event not found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class EventTeamListCreate(generics.ListCreateAPIView):
    """List and create teams for a specific event"""
    serializer_class = EnrollSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        event_id = self.kwargs['event_id']
        today = date.today()
        
        try:
            # Only allow access to upcoming events
            event = Event.objects.get(id=event_id, date__gte=today)
            return TeamEnroll.objects.filter(event=event)
        except Event.DoesNotExist:
            return TeamEnroll.objects.none()


class EventTeamDelete(generics.DestroyAPIView):
    """Delete team enrollment from an event"""
    serializer_class = EnrollSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        event_id = self.kwargs['event_id']
        today = date.today()
        
        try:
            # Only allow deletion from upcoming, approved events
            event = Event.objects.get(
                id=event_id, 
                approval_status='approved',
                date__gte=today  # KEY CHANGE: Only upcoming events
            )
            return TeamEnroll.objects.filter(event=event)
        except Event.DoesNotExist:
            return TeamEnroll.objects.none()