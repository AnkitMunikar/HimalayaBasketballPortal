# backend/accounts/views.py
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
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone

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

class CoachTeamDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TeamSerializer
    permission_classes = [IsCoach]
    
    def get_queryset(self):
        return Team.objects.filter(coach=self.request.user)

class CoachEventList(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsCoach]
    
    def get_queryset(self):
        # today= timezone.localdate(timezone='Asia/Kathmandu')
        # queryset= Event.objects.all()
        # if self.request.query.params.get('include_past') != 'true':
        #     queryset= queryset.filter(date__gt=today)
        return Event.objects.filter(approval_status='approved').order_by('-date')

class PlayerEventList(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsPlayer]
    
    def get_queryset(self):
        return Event.objects.filter(approval_status='approved').order_by('-date')

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

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            user = get_user_model().objects.get(username=request.data['username'])
            user_data = UserSerializer(user).data
            response.data['user'] = user_data
        return response
    
from accounts.permissions import IsEventOrganizer

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
class AdminEventUpdateView(generics.RetrieveUpdateAPIView):
    """Admin can update any event"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_event(request, event_id):
    """Quick approve an event"""
    try:
        event = Event.objects.get(pk=event_id)
        event.is_approved = True
        event.save()
        return Response({'status': 'approved'}, status=status.HTTP_200_OK)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_event(request, event_id):
    """Quick reject an event"""
    try:
        event = Event.objects.get(pk=event_id)
        event.is_approved = False
        event.save()
        return Response({'status': 'rejected'}, status=status.HTTP_200_OK)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    

@action(detail=False, methods=['get'], url_path='debug-coach')
def debug_coach_data(self, request):
    """Temporary debugging endpoint"""
    user = request.user
    if not user.is_authenticated:
        return Response({'error': 'Not authenticated'})
    
    # Check what's in the database
    all_enrollments = TeamEnroll.objects.all()
    user_enrollments = TeamEnroll.objects.filter(coach_name=user.name)
    
    return Response({
        'user_name': user.name,
        'user_role': user.role,
        'total_enrollments': all_enrollments.count(),
        'user_enrollments_count': user_enrollments.count(),
        'all_coach_names': list(all_enrollments.values_list('coach_name', flat=True).distinct()),
        'user_enrollments': EnrollSerializer(user_enrollments, many=True).data
    })