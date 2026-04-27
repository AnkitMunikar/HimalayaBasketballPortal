# backend/enroll/serializers.py - FINAL VERSION v4 (Fixed transaction issue)

from rest_framework import serializers
from .models import TeamEnroll, Player, Payment
from events.serializers import EventSerializer
from events.models import Event
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


class PlayerSerializer(serializers.ModelSerializer):
    """Player serializer - age is auto-calculated from DOB"""
    
    player_photo_url = serializers.SerializerMethodField(read_only=True)
    id_proof_url = serializers.SerializerMethodField(read_only=True)
    age = serializers.IntegerField(read_only=True)  # Auto-calculated from DOB
    team_name = serializers.SerializerMethodField(read_only=True)  # Team name from teamenroll
    teamenroll = serializers.SerializerMethodField(read_only=True)  # Team enrollment info
    
    class Meta:
        model = Player
        fields = [
            'id', 'player_name', 'age', 'dob', 'position', 'jersey_no',
            'player_photo', 'player_photo_url',
            'id_proof', 'id_proof_url',
            'teamenroll', 'team_name',  # Added team information
            'created_at'
        ]
        read_only_fields = [
            'id', 'age', 'player_photo_url', 'id_proof_url', 'teamenroll', 'team_name', 'created_at'
        ]
    
    def validate_dob(self, value):
        """Validate DOB is provided and not in the future"""
        if not value:
            raise serializers.ValidationError("Date of birth is required.")
        
        from datetime import date
        today = date.today()
        if value > today:
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        
        # Check if age would be reasonable (between 5 and 100)
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 5:
            raise serializers.ValidationError("Player must be at least 5 years old.")
        if age > 100:
            raise serializers.ValidationError("Invalid date of birth.")
        
        return value

    def get_player_photo_url(self, obj):
        """Get full URL for photo"""
        if obj.player_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.player_photo.url)
        return None

    def get_id_proof_url(self, obj):
        """Get full URL for document"""
        if obj.id_proof:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.id_proof.url)
        return None
    
    def get_team_name(self, obj):
        """Get team name from teamenroll"""
        if obj.teamenroll:
            return obj.teamenroll.team_name
        return None
    
    def get_teamenroll(self, obj):
        """Get team enrollment information"""
        if obj.teamenroll:
            return {
                'id': obj.teamenroll.id,
                'team_name': obj.teamenroll.team_name,
                'event': obj.teamenroll.event_id,
            }
        return None


class EnrollSerializer(serializers.ModelSerializer):
    """Team enrollment with players - FINAL v4 (Fixed transaction)"""
    
    # Players as writable nested serializer
    players = PlayerSerializer(many=True, required=True)
    event_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TeamEnroll
        fields = [
            'id', 'team_name', 'gender', 'coach_name', 'contact_number',
            'email', 'event', 'event_details', 'team', 'created_at', 'players'
        ]
        read_only_fields = ['id', 'created_at', 'event_details']

    def get_event_details(self, obj):
        """Get event info"""
        return EventSerializer(obj.event).data

    def validate_event(self, value):
        """Check if event allows new enrollments (skip on update - existing teams can be edited)"""
        if self.instance is not None:
            return value  # Update: do not block on can_enroll (event may be past/full)
        can_enroll, message = value.can_enroll()
        if not can_enroll:
            raise serializers.ValidationError(message)
        return value

    def validate_players(self, value):
        """Validate players list"""
        if not value:
            raise serializers.ValidationError("Players list is required.")
        
        count = len(value)
        if count < 8:
            raise serializers.ValidationError(f"At least 8 players are required (you have {count}).")
        if count > 15:
            raise serializers.ValidationError("Maximum 15 players allowed.")
        
        # Validate each player
        for idx, player in enumerate(value):
            if not isinstance(player, dict):
                raise serializers.ValidationError(f"Player {idx + 1}: Invalid format.")
                
            if not player.get('player_name', '').strip():
                raise serializers.ValidationError(f"Player {idx + 1}: Name is required.")
            if not player.get('dob'):
                raise serializers.ValidationError(f"Player {idx + 1}: Date of birth is required.")
            if not player.get('position'):
                raise serializers.ValidationError(f"Player {idx + 1}: Position is required.")
        
        return value

    def validate(self, data):
        """Check for duplicate coach enrollment per event"""
        event = data.get('event')
        request = self.context.get('request')
        user = request.user if request else None
        
        # On update, skip duplicate check
        if self.instance:
            return data
        
        # On create, check for duplicates
        if user and hasattr(user, 'name'):
            existing_enrollment = TeamEnroll.objects.filter(
                event=event,
                coach_name=user.name
            ).first()
            
            if existing_enrollment:
                raise serializers.ValidationError(
                    f"You have already enrolled a team ({existing_enrollment.team_name}) for this event."
                )
        
        return data

    def create(self, validated_data):
        """✅ FIXED v4: Create enrollment with players - proper transaction handling"""
        # Extract players from validated data
        players_data = validated_data.pop('players', [])
        event = validated_data.get('event')

        logger.info(f"Creating team with {len(players_data)} players")

        # ✅ FIXED: Wrap in explicit transaction
        with transaction.atomic():
            try:
                # ✅ CHANGED: Check event can_enroll WITHOUT select_for_update
                can_enroll, message = event.can_enroll()
                if not can_enroll:
                    raise serializers.ValidationError({"event": message})
                
                # Create team
                team = TeamEnroll.objects.create(**validated_data)
                logger.info(f"Team created: {team.id}")
                
                # Create players
                for idx, player_data in enumerate(players_data):
                    player = Player.objects.create(teamenroll=team, **player_data)
                    logger.info(f"Player {idx + 1} created: {player.player_name}")
                
                logger.info(f"Successfully created {len(players_data)} players for team {team.id}")
                return team
                
            except TeamEnroll.DoesNotExist:
                raise serializers.ValidationError({"team": "Team creation failed"})
            except Event.DoesNotExist:
                raise serializers.ValidationError({"event": "Event not found"})
            except Exception as e:
                logger.exception(f"Error creating team: {str(e)}")
                raise serializers.ValidationError(f"Error creating team: {str(e)}")

    def update(self, instance, validated_data):
        """Update enrollment and players. Update existing players in place so photos/documents are preserved."""
        players_data = validated_data.pop('players', None)
        
        # Update team fields
        instance.team_name = validated_data.get('team_name', instance.team_name)
        instance.gender = validated_data.get('gender', instance.gender)
        instance.coach_name = validated_data.get('coach_name', instance.coach_name)
        instance.contact_number = validated_data.get('contact_number', instance.contact_number)
        instance.email = validated_data.get('email', instance.email)
        instance.team = validated_data.get('team', instance.team)
        instance.save()
        
        # Update players in place (by id when provided) so existing player_photo and id_proof are preserved
        if players_data is not None:
            raw_players = self.initial_data.get('players', [])
            existing_by_id = {p.id: p for p in instance.players.all()}
            updated_ids = set()
            for idx, player_data in enumerate(players_data):
                player_id = raw_players[idx].get('id') if idx < len(raw_players) else None
                update_fields = {
                    'player_name': player_data.get('player_name', '').strip(),
                    'position': player_data.get('position') or 'PG',
                    'dob': player_data.get('dob'),
                    'jersey_no': player_data.get('jersey_no'),
                }
                if player_id and player_id in existing_by_id:
                    # Update existing player in place (keeps photo and id_proof)
                    p = existing_by_id[player_id]
                    p.player_name = update_fields['player_name']
                    p.position = update_fields['position']
                    p.dob = update_fields['dob']
                    p.jersey_no = update_fields['jersey_no']
                    p.save()
                    updated_ids.add(player_id)
                else:
                    # New player (no id or id not in this team)
                    Player.objects.create(teamenroll=instance, **update_fields)
            # Remove existing players that were not in the payload
            for pid, p in existing_by_id.items():
                if pid not in updated_ids:
                    p.delete()
        
        return instance


class PublicEnrollSerializer(serializers.ModelSerializer):
    """Public view of enrollment"""
    
    event_details = EventSerializer(source='event', read_only=True)
    players = PlayerSerializer(many=True, read_only=True)
    players_count = serializers.SerializerMethodField()

    class Meta:
        model = TeamEnroll
        fields = [
            'id', 'team_name', 'gender', 'coach_name', 'created_at', 
            'event_details', 'players', 'players_count'
        ]

    def get_players_count(self, obj):
        return obj.players.count()


class PaymentSerializer(serializers.ModelSerializer):
    """Payment tracking"""
    enrollment_team_name = serializers.CharField(source='enrollment.team_name', read_only=True)
    enrollment_event = serializers.IntegerField(source='enrollment.event_id', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'reference_id', 'enrollment', 'enrollment_team_name', 'enrollment_event',
            'amount', 'status',
            'khalti_txn_id', 'pidx', 'paid_at', 'created_at'
        ]
        read_only_fields = [
            'reference_id', 'khalti_txn_id', 'pidx', 'enrollment_team_name', 'enrollment_event',
            'paid_at', 'created_at'
        ]


class AdminPaymentSerializer(serializers.ModelSerializer):
    """Admin payment serializer - allows status updates"""
    
    class Meta:
        model = Payment
        fields = [
            'id', 'reference_id', 'enrollment', 'amount', 'status',
            'khalti_txn_id', 'pidx', 'paid_at', 'created_at'
        ]
        read_only_fields = [
            'reference_id', 'khalti_txn_id', 'pidx',
            'paid_at', 'created_at'
        ]
        # Note: status is NOT in read_only_fields, so admin can update it