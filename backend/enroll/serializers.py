from rest_framework import serializers
from .models import TeamEnroll, Player
from events.serializers import EventSerializer

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'player_name', 'age', 'position', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_age(self, value):
        """Ensure age is a valid integer"""
        try:
            age = int(value)
            if age < 1 or age > 99:
                raise serializers.ValidationError("Age must be between 1 and 99")
            return age
        except (ValueError, TypeError):
            raise serializers.ValidationError("Age must be a valid number")

class EnrollSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, required=False)  # Make players optional
    event_details = EventSerializer(source='event', read_only=True)

    class Meta:
        model = TeamEnroll
        fields = [
            'id', 'team_name', 'gender', 'coach_name', 'contact_number',
            'email', 'event', 'event_details', 'team', 'created_at', 'players'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_players(self, value):
        if value:  # Only validate if players are provided
            count = len(value)
            if count < 8:
                raise serializers.ValidationError("At least 8 players are required.")
            if count > 15:
                raise serializers.ValidationError("You can add up to 15 players only.")
        return value

    def validate(self, data):
        """
        ✅ UPDATED: Only check for duplicate coach enrollment per event
        Players CAN be reused across different events (local system feature)
        """
        event = data.get('event')
        
        # Get the current user from context
        request = self.context.get('request')
        user = request.user if request else None
        
        # Don't validate on update, only on create
        if self.instance:
            return data
        
        # ✅ ONLY CHECK: Same coach cannot enroll multiple teams for same event
        if user and hasattr(user, 'name'):
            existing_enrollment = TeamEnroll.objects.filter(
                event=event,
                coach_name=user.name
            ).first()
            
            if existing_enrollment:
                raise serializers.ValidationError(
                    f"You have already enrolled a team ({existing_enrollment.team_name}) for this event. "
                    f"A coach can only enroll one team per event. "
                    f"You can use the same players for different events though!"
                )
        
        return data

    def create(self, validated_data):
        players_data = validated_data.pop('players', [])
        team = TeamEnroll.objects.create(**validated_data)
        
        for player_data in players_data:
            Player.objects.create(teamenroll=team, **player_data)
        
        return team

    def update(self, instance, validated_data):
        players_data = validated_data.pop('players', None)  # Allow updates without players
        
        instance.team_name = validated_data.get('team_name', instance.team_name)
        instance.gender = validated_data.get('gender', instance.gender)
        instance.coach_name = validated_data.get('coach_name', instance.coach_name)
        instance.contact_number = validated_data.get('contact_number', instance.contact_number)
        instance.email = validated_data.get('email', instance.email)
        instance.team = validated_data.get('team', instance.team)
        instance.save()
        
        if players_data is not None:  # Only update players if provided
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