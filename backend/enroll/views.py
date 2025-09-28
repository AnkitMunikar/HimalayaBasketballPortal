from rest_framework import viewsets, generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.permissions import OR
from accounts.permissions import IsCoach, IsEventOrganizer
from .models import TeamEnroll, Player
from .serializers import EnrollSerializer, PlayerSerializer, PublicEnrollSerializer
import logging
from events.models import Event

logger = logging.getLogger(__name__)

class EnrollViews(viewsets.ModelViewSet):
    serializer_class = EnrollSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated()]
        else:
            permission_classes = [IsAuthenticated(), OR(IsCoach(), IsEventOrganizer())]
        logger.info(f"Action: {self.action}, Permissions: {[perm.__class__.__name__ for perm in permission_classes]}, User: {self.request.user}, Role: {self.request.user.role if self.request.user.is_authenticated else 'Unauthenticated'}")
        return permission_classes

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            logger.warning("Unauthenticated user attempted to access queryset")
            return TeamEnroll.objects.none()
        if user.role == 'coach':
            logger.info(f"Fetching enrollments for coach: {user.name}")
            return TeamEnroll.objects.filter(coach_name=user.name).select_related('event')
        elif user.role == 'event_organizer':
            logger.info(f"Fetching enrollments for event organizer: {user.name}")
            return TeamEnroll.objects.filter(event__organizer=user).select_related('event')
        logger.warning(f"User {user.name} with role {user.role} not authorized for enrollments")
        return TeamEnroll.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'coach':
            coach_team = user.team_set.first()
            if not coach_team:
                logger.error(f"No team assigned to coach: {user.name}")
                return Response({"detail": "No team assigned to this coach."}, status=status.HTTP_400_BAD_REQUEST)
            serializer.save(
                coach_name=user.name,
                team=coach_team
            )
            logger.info(f"Created enrollment for team: {coach_team.name} by coach: {user.name}")
        elif user.role == 'event_organizer':
            serializer.save(coach_name=user.name)  # Allow organizers to enroll teams without a team_set
            logger.info(f"Created enrollment by event organizer: {user.name}")
        else:
            logger.error(f"User {user.name} with role {user.role} not authorized to create enrollment")
            return Response({"detail": "Not authorized to create team enrollment."}, status=status.HTTP_403_FORBIDDEN)

    def perform_update(self, serializer):
        logger.info(f"Updating enrollment {self.get_object().id} by user: {self.request.user}")
        serializer.save()

    def perform_destroy(self, instance):
        logger.info(f"Deleting enrollment {instance.id} by user: {self.request.user}")
        instance.delete()

class PlayerViews(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    permission_classes = [IsAuthenticated, IsCoach]

# backend/enroll/views.py (UPDATE THIS VIEW)


class EventTeamsListView(generics.ListAPIView):
    serializer_class = PublicEnrollSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        event_id = self.kwargs['event_id']
        logger.info(f"Fetching teams for event ID: {event_id}")
        
        # Only show teams for approved events
        try:
            event = Event.objects.get(id=event_id, approval_status='approved')
            return TeamEnroll.objects.filter(event=event).select_related('event', 'team')
        except Event.DoesNotExist:
            # Event doesn't exist or is not approved
            return TeamEnroll.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            event_id = self.kwargs['event_id']
            try:
                event = Event.objects.get(id=event_id)
                if event.approval_status == 'pending':
                    return Response(
                        {"detail": "This event is pending approval."}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                elif event.approval_status == 'rejected':
                    return Response(
                        {"detail": "This event has been rejected.", "reason": event.rejection_reason}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                else:
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
    serializer_class = EnrollSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        event_id = self.kwargs['event_id']
        try:
            event = Event.objects.get(id=event_id)
            return TeamEnroll.objects.filter(event=event)
        except Event.DoesNotExist:
            return TeamEnroll.objects.none()

class EventTeamDelete(generics.DestroyAPIView):
    serializer_class = EnrollSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        event_id = self.kwargs['event_id']
        # Only allow deletion from approved events
        try:
            event = Event.objects.get(id=event_id, approval_status='approved')
            return TeamEnroll.objects.filter(event=event)
        except Event.DoesNotExist:
            return TeamEnroll.objects.none()