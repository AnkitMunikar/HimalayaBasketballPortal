# 4. ENROLL/SERIALIZERS.PY - Remove grade field
# ====================================================================================

from rest_framework import serializers
from .models import TeamEnroll, Player
from events.serializers import EventSerializer

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'player_name', 'age', 'position', 'created_at']  # Removed 'grade'
        read_only_fields = ['id', 'created_at']

class EnrollSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, required=True)
    event_details = EventSerializer(source='event', read_only=True)

    class Meta:
        model = TeamEnroll
        fields = [
            'id', 'team_name', 'gender', 'coach_name', 'contact_number',
            'email', 'event', 'event_details', 'team', 'created_at', 'players'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_players(self, value):
        count = len(value)
        if count < 8:
            raise serializers.ValidationError("At least 8 players are required.")
        if count > 15:
            raise serializers.ValidationError("You can add up to 15 players only.")
        return value

    def validate(self, data):
        event = data.get('event')
        team_name = data.get('team_name')
        
        if self.instance:
            return data
            
        if TeamEnroll.objects.filter(event=event, team_name=team_name).exists():
            raise serializers.ValidationError("This team is already enrolled in this event.")
        
        return data

    def create(self, validated_data):
        players_data = validated_data.pop('players', [])
        team = TeamEnroll.objects.create(**validated_data)
        
        for player_data in players_data:
            Player.objects.create(teamenroll=team, **player_data)
        
        return team

    def update(self, instance, validated_data):
        players_data = validated_data.pop('players', [])
        
        instance.gender = validated_data.get('gender', instance.gender)
        instance.coach_name = validated_data.get('coach_name', instance.coach_name)
        instance.contact_number = validated_data.get('contact_number', instance.contact_number)
        instance.email = validated_data.get('email', instance.email)
        instance.save()
        
        instance.players.all().delete()
        
        for player_data in players_data:
            Player.objects.create(teamenroll=instance, **player_data)
        
        return instance

class PublicEnrollSerializer(serializers.ModelSerializer):
    event_details = EventSerializer(source='event', read_only=True)
    players_count = serializers.SerializerMethodField()

    class Meta:
        model = TeamEnroll
        fields = [
            'id', 'team_name', 'gender', 'coach_name', 'created_at', 
            'event_details', 'players_count'
        ]

    def get_players_count(self, obj):
        return obj.players.count()
