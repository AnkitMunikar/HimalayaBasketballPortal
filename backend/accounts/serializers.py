# backend/accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Team
from events.models import Event
from django.db import transaction
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    """Simple user serializer for listings"""
    is_superuser = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'email', 'name', 'phone', 'role', 'is_email_verified', 'is_superuser']

class AdminUserSerializer(serializers.ModelSerializer):
    """Admin-specific user serializer with additional fields"""
    class Meta:
        model = get_user_model()
        fields = [
            'id', 'username', 'email', 'name', 'phone', 'role', 
            'is_active', 'is_email_verified', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    confirm_email = serializers.EmailField()

    class Meta:
        model = get_user_model()
        fields = ['name', 'username', 'email', 'confirm_email', 'phone', 'password', 'confirm_password', 'role']

    def validate(self, data):
        if data['email'] != data['confirm_email']:
            raise serializers.ValidationError({"confirm_email": "Emails must match"})
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords must match"})
        # Enforce: min 8 chars, at least one uppercase, one digit, one special character
        try:
            validate_password(data['password'])
        except Exception as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        if get_user_model().objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "This username is already taken"})
        if get_user_model().objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "This email is already registered"})
        return data
    
    def validate_role(self, value):
        valid_roles = [choice[0] for choice in get_user_model().ROLE_CHOICES]
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Must be one of: {valid_roles}")
        return value

    def create(self, validated_data):
        validated_data.pop('confirm_email')
        validated_data.pop('confirm_password')
        
        with transaction.atomic():  # Ensure atomicity
            user = get_user_model().objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                role=validated_data['role'],
                name=validated_data.get('name'),
                phone=validated_data.get('phone'),
                is_active=False,
                is_email_verified=False
            )
            try:
                user.generate_verification_token()
                print(f"User created: {user.email}, Token: {user.email_verification_token}, Sent at: {user.email_verification_sent_at}")
            except Exception as e:
                print(f"Token generation failed for {user.email}: {e}")
                raise
        return user
        
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
                    'jersey_no': player.jersey_no,
                    # 'grade': player.grade,
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
    

# 🔐 NEW: Forgot Password Serializer
class ForgotPasswordSerializer(serializers.Serializer):
    """
    Serializer for requesting password reset
    User provides their email
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """
        Validate that email exists in database
        Note: We don't reveal if email exists for security
        """
        # Normalize email (lowercase)
        return value.lower()


# 🔐 NEW: Reset Password Serializer
class ResetPasswordSerializer(serializers.Serializer):
    """
    Serializer for actually resetting the password
    User provides: token, new password, confirm password
    """
    token = serializers.UUIDField(required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    
    def validate(self, data):
        """
        Validate that passwords match and meet requirements
        """
        # Check if passwords match
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
            })
        
        # Validate password strength using Django's built-in validators
        try:
            validate_password(data['new_password'])
        except Exception as e:
            raise serializers.ValidationError({
                "new_password": list(e.messages)
            })
        
        return data
    
    def validate_token(self, value):
        """
        Validate that token exists and is valid
        """
        try:
            user = get_user_model().objects.get(password_reset_token=value)
            
            # Check if token is still valid
            if not user.is_password_reset_token_valid():
                raise serializers.ValidationError("Password reset link has expired. Please request a new one.")
            
            # Store user for later use in view
            self.context['user'] = user
            
        except get_user_model().DoesNotExist:
            raise serializers.ValidationError("Invalid password reset link.")
        
        return value