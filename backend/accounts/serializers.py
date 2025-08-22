# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Team
from events.models import Event
from django.contrib.auth.models import Group, Permission
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

class UserSerializer(serializers.ModelSerializer):
    """Simple user serializer for listings"""
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'email', 'name', 'phone', 'role']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    confirm_email = serializers.EmailField(write_only=True)

    class Meta:
        model = get_user_model()

        fields = ['name', 'username', 'email', 'confirm_email', 'phone', 'password', 'confirm_password', 'role']

    def validate(self, data):
        # Validate email matching
        if data['email'] != data['confirm_email']:
            raise serializers.ValidationError({"confirm_email": "Emails must match"})
        
        # Validate password matching
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords must match"})
        
        # Check if username is already taken
        if get_user_model().objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "This username is already taken"})
        
        # Check if email is already taken
        if get_user_model().objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "This email is already registered"})
        
        return data
    
    def validate_role(self, value):
        """Validate role is one of the allowed choices"""
        valid_roles = [choice[0] for choice in get_user_model().ROLE_CHOICES]
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Must be one of: {valid_roles}")
        return value

    def create(self, validated_data):
        validated_data.pop('confirm_email')
        validated_data.pop('confirm_password')
        user = get_user_model().objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            name=validated_data.get('name'),
            phone=validated_data.get('phone'),
            is_active=True
        )
        return user
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,   # only if your CustomUser has role field
    })

class TeamSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.name', read_only=True)
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'coach', 'coach_name', 'created_at']
        read_only_fields = ['id', 'created_at']

class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.name', read_only=True)
    enrolled_teams_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = ['id', 'name', 'date', 'venue', 'organizer', 'organizer_name', 
                 'gender', 'level', 'duration_type', 'payment', 'created_at', 'enrolled_teams_count']
        read_only_fields = ['id', 'created_at']
    
    def get_enrolled_teams_count(self, obj):
        return obj.enrollments.count()

class TeamWithPlayersSerializer(serializers.ModelSerializer):
    players = serializers.SerializerMethodField()
    players_count = serializers.SerializerMethodField()
    coach_name = serializers.CharField(source='coach.name', read_only=True)
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'coach', 'coach_name', 'created_at', 'players', 'players_count']
        read_only_fields = ['id', 'created_at']

    def get_players(self, obj):
        # Get players from enrolled teams
        from enroll.models import TeamEnroll
        enrollments = TeamEnroll.objects.filter(team=obj).prefetch_related('players')
        all_players = []
        for enrollment in enrollments:
            for player in enrollment.players.all():
                all_players.append({
                    'id': player.id,
                    'player_name': player.player_name,
                    'age': player.age,
                    'position': player.position,
                    'grade': player.grade,
                    'enrollment_id': enrollment.id,
                    'event_name': enrollment.event.name
                })
        return all_players

    def get_players_count(self, obj):
        from enroll.models import TeamEnroll
        count = 0
        enrollments = TeamEnroll.objects.filter(team=obj)
        for enrollment in enrollments:
            count += enrollment.players.count()
        return count
    
class TeamWithPlayersSerializer(serializers.ModelSerializer):
    players = serializers.SerializerMethodField()
    players_count = serializers.SerializerMethodField()
    coach_name = serializers.CharField(source='coach.name', read_only=True)
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'coach', 'coach_name', 'created_at', 'players', 'players_count']
        read_only_fields = ['id', 'created_at']

    def get_players(self, obj):
        from enroll.models import TeamEnroll
        enrollments = TeamEnroll.objects.filter(team=obj).prefetch_related('players')
        all_players = []
        for enrollment in enrollments:
            for player in enrollment.players.all():
                all_players.append({
                    'id': player.id,
                    'player_name': player.player_name,
                    'age': player.age,
                    'position': player.position,
                    # REMOVED: 'grade': player.grade,
                    'enrollment_id': enrollment.id,
                    'event_name': enrollment.event.name
                })
        return all_players

    def get_players_count(self, obj):
        from enroll.models import TeamEnroll
        count = 0
        enrollments = TeamEnroll.objects.filter(team=obj)
        for enrollment in enrollments:
            count += enrollment.players.count()
        return count