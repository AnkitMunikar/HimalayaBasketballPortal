from rest_framework import serializers
from .models import TeamEnroll, Player

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'player_name', 'age', 'position', 'grade', 'created_at']
        read_only_fields = ['id', 'created_at']

class EnrollSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, required=True)

    class Meta:
        model = TeamEnroll
        fields = [
            'id',
            'team_name',
            'gender',
            'coach_name',
            'contact_number',
            'email',
            'event',
            'created_at',
            'players'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_players(self, value):
        count = len(value)
        if count < 8:
            raise serializers.ValidationError("At least 8 players are required.")
        if count > 15:
            raise serializers.ValidationError("You can add up to 15 players only.")
        return value

    def create(self, validated_data):
        players_data = validated_data.pop('players', [])
        # Double-check player count here as well
        if len(players_data) < 12 or len(players_data) > 15:
            raise serializers.ValidationError("Players count must be between 8 and 15.")
        team = TeamEnroll.objects.create(**validated_data)
        for player_data in players_data:
            Player.objects.create(teamenroll=team, **player_data)  # Adjust FK field name
        return team
