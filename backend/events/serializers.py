# backend/events/serializers.py
from rest_framework import serializers
from .models import Event, EventTeamStanding
from django.contrib.auth import get_user_model

class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.name', read_only=True)
    organizer_email = serializers.CharField(source='organizer.email', read_only=True)
    enrolled_teams_count = serializers.SerializerMethodField(read_only=True)
    
    # ✨ NEW: Add enrollment status fields
    current_enrollment_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    available_slots = serializers.IntegerField(read_only=True)
    can_enroll_status = serializers.SerializerMethodField(read_only=True)
    
    # ✨ NEW: Add URL fields for files
    logo_url = serializers.SerializerMethodField(read_only=True)
    venue_receipt_url = serializers.SerializerMethodField(read_only=True)

    def validate_payment(self, value):
        if value.lower() == 'free':
            return 'Free'
        try:
            float(value)
            return value
        except (ValueError, TypeError):
            raise serializers.ValidationError("Payment must be 'Free' or a valid number")
    
    def validate_max_teams(self, value):
        """Validate max_teams field"""
        if value < 0:
            raise serializers.ValidationError("Max teams cannot be negative")
        if value > 100:
            raise serializers.ValidationError("Max teams cannot exceed 100")
        return value

    def validate_organizer(self, value):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authenticated user required")
        
        # Allow admins to update organizer field without restriction
        is_admin = request.user.is_superuser or (hasattr(request.user, 'role') and request.user.role == 'admin')
        if is_admin:
            return value
        
        # For non-admin users, organizer must match authenticated user
        if value.id != request.user.id:
            raise serializers.ValidationError("Organizer ID must match the authenticated user")
        return value

    def validate(self, data):
        request = self.context.get('request')
        organizer = data.get('organizer')
        is_admin = request and request.user.is_authenticated and (request.user.is_superuser or (hasattr(request.user, 'role') and request.user.role == 'admin'))
        
        # If no organizer provided:
        if not organizer and request and request.user.is_authenticated:
            if self.instance:
                # Update: preserve existing organizer (don't change it)
                # Remove organizer from data so it won't be updated
                data.pop('organizer', None)
            else:
                # Create: use authenticated user
                data['organizer'] = request.user
                organizer = request.user
        
        # Only check role for new events (create) and non-admin users
        if not self.instance and organizer and not is_admin and organizer.role != 'event_organizer':
            raise serializers.ValidationError("Only event organizers can create events")
        
        return data

    def create(self, validated_data):
        if 'organizer' not in validated_data:
            validated_data['organizer'] = self.context['request'].user
        return super().create(validated_data)

    def get_enrolled_teams_count(self, obj):
        """Get the count of enrolled teams for this event"""
        return obj.enrollments.count()
    
    def get_can_enroll_status(self, obj):
        """Get enrollment status message"""
        can_enroll, message = obj.can_enroll()
        return {
            'can_enroll': can_enroll,
            'message': message
        }
    
    def get_logo_url(self, obj):
        """Get full URL for event logo"""
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
        return None
    
    def get_venue_receipt_url(self, obj):
        """Get full URL for venue receipt PDF"""
        if obj.venue_receipt:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.venue_receipt.url)
        return None

    class Meta:
        model = Event
        fields = [
            'id', 'name', 'description', 'date', 'end_date', 'venue', 'city', 'gender',
            'level', 'duration_type', 'payment', 'organizer', 'organizer_name', 'organizer_email',
            'logo', 'logo_url', 'venue_receipt', 'venue_receipt_url', 'approval_status', 'rejection_reason',
            'approved_by', 'approved_at',
            'max_teams',
            'enrolled_teams_count', 'current_enrollment_count',
            'is_full', 'available_slots', 'can_enroll_status'
        ]
        read_only_fields = [
            'id', 'organizer_name', 'organizer_email', 'logo_url', 'venue_receipt_url',
            'approval_status', 'rejection_reason',
            'approved_by', 'approved_at', 'enrolled_teams_count',
            'current_enrollment_count', 'is_full', 'available_slots', 'can_enroll_status'
        ]


class StandingSerializer(serializers.ModelSerializer):
    """Standings row for public display (read). Rank is set in view."""
    team_name = serializers.CharField(source='team_enrollment.team_name', read_only=True)
    team_enrollment_id = serializers.IntegerField(source='team_enrollment.id', read_only=True)
    points_diff = serializers.IntegerField(read_only=True)

    class Meta:
        model = EventTeamStanding
        fields = [
            'id', 'team_enrollment_id', 'team_name',
            'wins', 'losses', 'points_for', 'points_against',
            'points_diff'
        ]
        read_only_fields = ['points_diff']


class StandingUpdateItemSerializer(serializers.Serializer):
    """One row for bulk standings update."""
    team_enrollment_id = serializers.IntegerField()
    wins = serializers.IntegerField(min_value=0, default=0)
    losses = serializers.IntegerField(min_value=0, default=0)
    points_for = serializers.IntegerField(min_value=0, default=0)
    points_against = serializers.IntegerField(min_value=0, default=0)