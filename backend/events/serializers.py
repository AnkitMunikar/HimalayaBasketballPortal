# backend/events/serializers.py
from rest_framework import serializers
from .models import Event
from django.contrib.auth import get_user_model

class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.name', read_only=True)

    def validate_payment(self, value):
        if value.lower() == 'free':
            return 'Free'
        try:
            float(value)
            return value
        except (ValueError, TypeError):
            raise serializers.ValidationError("Payment must be 'Free' or a valid number")

    def validate_organizer(self, value):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authenticated user required")
        if value.id != request.user.id:
            raise serializers.ValidationError("Organizer ID must match the authenticated user")
        return value

    def validate(self, data):
        request = self.context.get('request')
        organizer = data.get('organizer')
        
        # If no organizer provided, use authenticated user
        if not organizer and request and request.user.is_authenticated:
            data['organizer'] = request.user
            organizer = request.user
        
        # Only check role for new events (create)
        if not self.instance and organizer and organizer.role != 'event_organizer':
            raise serializers.ValidationError("Only event organizers can create events")
        
        return data

    def create(self, validated_data):
        if 'organizer' not in validated_data:
            validated_data['organizer'] = self.context['request'].user
        return super().create(validated_data)

    class Meta:
        model = Event
        fields = [
            'id', 'name', 'description', 'date', 'venue', 'city', 'gender',
            'level', 'duration_type', 'payment', 'organizer', 'organizer_name',
            'logo', 'venue_receipt', 'approval_status', 'rejection_reason',
            'approved_by', 'approved_at'
        ]
        read_only_fields = ['id', 'organizer_name', 'approval_status', 'rejection_reason', 'approved_by', 'approved_at']