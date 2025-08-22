from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import Team
from events.models import Event
from enroll.models import TeamEnroll
from .serializers import RegisterSerializer, TeamSerializer, EventSerializer, UserSerializer
from .permissions import IsEventOrganizer, IsCoach, IsPlayer
from rest_framework.decorators import api_view, permission_classes

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "User registered successfully",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrganizerTeamListCreate(generics.ListCreateAPIView):
    serializer_class = TeamSerializer
    permission_classes = [IsEventOrganizer]
    
    def get_queryset(self):
        return Team.objects.all().select_related('coach')

class OrganizerEventListCreate(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsEventOrganizer]
    
    def get_queryset(self):
        return Event.objects.filter(organizer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

class CoachTeamListCreate(generics.ListCreateAPIView):
    serializer_class = TeamSerializer
    permission_classes = [IsCoach]
    
    def get_queryset(self):
        return Team.objects.filter(coach=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(coach=self.request.user)

class CoachEventList(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsCoach]
    
    def get_queryset(self):
        return Event.objects.all()

class PlayerEventList(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsPlayer]
    
    def get_queryset(self):
        return Event.objects.all()

class PlayerList(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return get_user_model().objects.filter(role='player')

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
    })

class CoachTeamListCreate(generics.ListCreateAPIView):
    serializer_class = TeamSerializer
    permission_classes = [IsCoach]
    
    def get_queryset(self):
        return Team.objects.filter(coach=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(coach=self.request.user)

class CoachTeamDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TeamSerializer
    permission_classes = [IsCoach]
    
    def get_queryset(self):
        return Team.objects.filter(coach=self.request.user)

class CoachEventList(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsCoach]
    
    def get_queryset(self):
        return Event.objects.all().order_by('-date')