from rest_framework import viewsets, generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsCoach
from .models import TeamEnroll, Player
from .serializers import EnrollSerializer, PlayerSerializer, PublicEnrollSerializer

class EnrollViews(viewsets.ModelViewSet):
    serializer_class = EnrollSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsCoach()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'coach':
            # Return only teams enrolled by this coach
            return TeamEnroll.objects.filter(coach_name=user.name).select_related('event')
        return TeamEnroll.objects.none()

    def perform_create(self, serializer):
        # Auto-populate coach name and link to team if exists
        user = self.request.user
        coach_team = user.team_set.first()  # Get first team if exists
        
        serializer.save(
            coach_name=user.name,
            team=coach_team
        )

class PlayerViews(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    permission_classes = [IsAuthenticated, IsCoach]

class EventTeamsListView(generics.ListAPIView):
    serializer_class = PublicEnrollSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        event_id = self.kwargs['event_id']
        return TeamEnroll.objects.filter(event_id=event_id).select_related('event', 'team')