from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.name', read_only=True)
    enrolled_teams_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'date', 'venue', 'city', 'organizer', 'organizer_name',  # Added city
            'gender', 'level', 'duration_type', 'payment', 'created_at', 'enrolled_teams_count'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_enrolled_teams_count(self, obj):
        return obj.enrollments.count()