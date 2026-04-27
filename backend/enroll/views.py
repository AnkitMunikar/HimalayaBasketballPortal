# backend/enroll/views.py - FIXED VERSION

from rest_framework import viewsets, generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from accounts.permissions import IsCoach, IsEventOrganizer, IsAdmin
from django.db.models import Q
from .models import TeamEnroll, Player, Payment
from .serializers import EnrollSerializer, PlayerSerializer, PublicEnrollSerializer, PaymentSerializer, AdminPaymentSerializer
from .age_validation import validate_players_age_for_event
from events.models import Event
from events.serializers import EventSerializer
from datetime import date
import logging
import requests
import json
from django.conf import settings
from django.utils import timezone
import uuid
from rest_framework.decorators import api_view, permission_classes
from django.db import transaction
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)


def _normalize_enrollment_request_data(request):
    """
    When client sends multipart/form-data with keys like players[0][player_name],
    DRF does not parse them into a nested list. Build the structure the serializer expects.
    """
    data = request.data
    if not data:
        return data
    # If players is already a list (e.g. from JSON), return as-is (ensure event is int)
    players = data.get('players')
    if isinstance(players, list) and len(players) > 0:
        payload = {
            'team_name': data.get('team_name'),
            'gender': data.get('gender'),
            'coach_name': data.get('coach_name'),
            'contact_number': data.get('contact_number') or '',
            'email': data.get('email'),
            'event': data.get('event'),
            'players': players,
        }
        if payload.get('event') is not None:
            try:
                payload['event'] = int(payload['event'])
            except (TypeError, ValueError):
                pass
        return payload
    # Build players from flat form keys: players[0][player_name], players[0][dob], ...
    keys_list = list(data.keys()) if hasattr(data, 'keys') else []
    players = []
    i = 0
    while True:
        key = f'players[{i}][player_name]'
        has_key = key in data or any(k.startswith(f'players[{i}]') for k in keys_list)
        if not has_key:
            break
        player = {
            'player_name': (data.get(f'players[{i}][player_name]') or '').strip(),
            'position': data.get(f'players[{i}][position]') or 'PG',
            'dob': data.get(f'players[{i}][dob]') or None,
            'jersey_no': data.get(f'players[{i}][jersey_no]') or None,
        }
        if not player['player_name'] and not player['dob']:
            i += 1
            continue
        # Attach files from request.FILES
        if request.FILES:
            photo = request.FILES.get(f'players[{i}][player_photo]')
            id_proof = request.FILES.get(f'players[{i}][id_proof]')
            if photo:
                player['player_photo'] = photo
            if id_proof:
                player['id_proof'] = id_proof
        players.append(player)
        i += 1
    if not players:
        return data
    event_val = data.get('event')
    try:
        event_val = int(event_val) if event_val is not None else None
    except (TypeError, ValueError):
        pass
    return {
        'team_name': data.get('team_name'),
        'gender': data.get('gender'),
        'coach_name': data.get('coach_name'),
        'contact_number': data.get('contact_number') or '',
        'email': data.get('email'),
        'event': event_val,
        'players': players,
    }


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def test_auth(request):
    """
    Test endpoint to verify JWT authentication is working
    Temporary - remove after debugging
    """
    return Response({
        'success': True,
        'authenticated': True,
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'name': getattr(request.user, 'name', 'N/A'),
            'email': request.user.email,
            'role': getattr(request.user, 'role', 'N/A'),
        },
        'method': request.method,
        'headers': {
            'Authorization': request.META.get('HTTP_AUTHORIZATION', 'Not provided'),
            'Content-Type': request.META.get('CONTENT_TYPE', 'Not provided'),
        },
        'message': '✅ Authentication is working perfectly!'
    }, status=status.HTTP_200_OK)




# ============================================================================
# TEAM ENROLLMENT VIEWS
# ============================================================================

class EnrollViews(viewsets.ModelViewSet):
    """ViewSet for team enrollment - handles players via nested serializer"""
    serializer_class = EnrollSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        today = date.today()
        
        if not user.is_authenticated:
            return TeamEnroll.objects.none()
        
        # Admin can see all enrollments
        if user.is_superuser or (hasattr(user, 'role') and user.role == 'admin'):
            return TeamEnroll.objects.all().select_related('event', 'team').prefetch_related('players').order_by('-created_at')
            
        if hasattr(user, 'role'):
            if user.role == 'coach':
                # Show all teams the coach has registered (past and upcoming events)
                return TeamEnroll.objects.filter(
                    coach_name=user.name
                ).select_related('event').prefetch_related('players').order_by('-event__date', '-created_at')
                
            elif user.role == 'event_organizer':
                return TeamEnroll.objects.filter(
                    event__organizer=user,
                    event__date__gte=today
                ).select_related('event').prefetch_related('players')
        
        return TeamEnroll.objects.none()

    def perform_create(self, serializer):
        """✅ FIXED: Create team enrollment with proper transaction handling"""
        user = self.request.user
        coach_name = user.name if hasattr(user, 'name') else user.username
        
        try:
            logger.info(f"Creating enrollment for coach: {coach_name}")
            serializer.save(coach_name=coach_name)
            logger.info(f"Enrollment created successfully")
        except Exception as e:
            logger.exception(f"Error in perform_create: {str(e)}")
            raise

    def create(self, request, *args, **kwargs):
        """✅ FIXED: Override create to handle free vs paid events"""
        try:
            logger.info(f"POST /enroll/teams/ - Request data: {request.data}")
            
            event_id = request.data.get('event')
            if not event_id:
                return Response({'error': 'event is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                event = Event.objects.select_for_update().get(id=event_id)
                
                # Check if paid event
                is_paid = (
                    event.payment and 
                    str(event.payment).lower() != 'free' and
                    float(event.payment) > 0
                )
                
                if is_paid:
                    return Response(
                        {
                            'error': 'This is a paid event. Use payment flow.',
                            'payment_required': True,
                            'amount': float(event.payment)
                        }, 
                        status=status.HTTP_402_PAYMENT_REQUIRED
                    )
                
                # Check availability for free events
                can_enroll, message = event.can_enroll()
                if not can_enroll:
                    return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
                
                # Create enrollment for free event (normalize multipart form data when photos/files sent)
                payload = _normalize_enrollment_request_data(request)
                serializer = self.get_serializer(data=payload)
                serializer.is_valid(raise_exception=True)
                self.perform_create(serializer)
                
                headers = self.get_success_headers(serializer.data)
                logger.info(f"✅ Free enrollment successful: Team {serializer.instance.id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            logger.warning(f"Validation error: {e.detail}")
            return Response({"error": str(e.detail)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Unexpected error: {str(e)}")
            return Response(
                {"error": "Failed to create enrollment", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_update(self, serializer):
        """Update team enrollment"""
        try:
            logger.info(f"Updating team: {self.get_object().id}")
            serializer.save()
            logger.info("Team updated successfully")
        except Exception as e:
            logger.exception(f"Error in perform_update: {str(e)}")
            raise

    def update(self, request, *args, **kwargs):
        """✅ FIXED: Override update for better error handling"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            logger.info(f"PUT /enroll/teams/{instance.id}/ - Request data: {request.data}")
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            logger.info("Team update successful")
            return Response(serializer.data)
            
        except ValidationError as e:
            logger.warning(f"Validation error: {e.detail}")
            detail = e.detail
            if isinstance(detail, dict):
                parts = []
                for k, v in detail.items():
                    if isinstance(v, list):
                        parts.extend(str(x) for x in v)
                    else:
                        parts.append(str(v))
                msg = " ".join(parts) if parts else str(detail)
            elif isinstance(detail, list):
                msg = " ".join(str(x) for x in detail)
            else:
                msg = str(detail)
            return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Unexpected error: {str(e)}")
            return Response(
                {"error": "Failed to update team", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================================
# PLAYER VIEWS - READ ONLY
# ============================================================================

class PlayerViews(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing players - read only"""
    queryset = Player.objects.all().select_related('teamenroll')
    serializer_class = PlayerSerializer
    permission_classes = [IsAuthenticated]


# ============================================================================


# ============================================================================
# ADMIN PLAYER MANAGEMENT ENDPOINTS
# ============================================================================

class AdminPlayerViews(viewsets.ModelViewSet):
    """Admin ViewSet for full CRUD operations on players"""
    queryset = Player.objects.all().select_related('teamenroll', 'teamenroll__event').order_by('-created_at')
    serializer_class = PlayerSerializer
    
    def get_permissions(self):
        """
        Allow read for authenticated users, but write operations only for admins
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdmin]
        return [permission() for permission in permission_classes]


# ============================================================================
# COACH PLAYER FILE UPLOAD ENDPOINT
# ============================================================================

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_player_files(request, player_id):
    """
    Allow coaches to update their own players' files (photo and ID proof)
    Similar to how event management dashboard works
    """
    try:
        player = get_object_or_404(Player, id=player_id)
        user = request.user
        
        # Check if user is admin or the coach who owns this player's team
        is_admin = user.is_superuser or (hasattr(user, 'role') and user.role == 'admin')
        is_coach = (
            hasattr(user, 'role') and 
            user.role == 'coach' and 
            hasattr(user, 'name') and
            player.teamenroll.coach_name == user.name
        )
        
        if not (is_admin or is_coach):
            return Response(
                {'error': 'You do not have permission to update this player'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update files if provided
        if 'player_photo' in request.FILES:
            player.player_photo = request.FILES['player_photo']
            logger.info(f"Updating photo for player {player.id}")
        
        if 'id_proof' in request.FILES:
            player.id_proof = request.FILES['id_proof']
            logger.info(f"Updating ID proof for player {player.id}")
        
        player.save()
        
        # Return updated player data
        serializer = PlayerSerializer(player, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Player.DoesNotExist:
        return Response(
            {'error': 'Player not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.exception(f"Error updating player files: {str(e)}")
        return Response(
            {'error': f'Failed to update player files: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# PUBLIC EVENT TEAM LISTING
# ============================================================================

class EventTeamsListView(generics.ListAPIView):
    """List teams enrolled in an approved event (upcoming or past, for standings etc.)."""
    serializer_class = PublicEnrollSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        event_id = self.kwargs['event_id']
        try:
            event = Event.objects.get(id=event_id, approval_status='approved')
            return TeamEnroll.objects.filter(event=event).select_related('event', 'team').prefetch_related('players')
        except Event.DoesNotExist:
            return TeamEnroll.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        if not queryset.exists():
            event_id = self.kwargs['event_id']
            try:
                event = Event.objects.get(id=event_id)
                if event.approval_status != 'approved':
                    return Response(
                        {"detail": "Event is not approved."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                return Response(
                    {"detail": "No teams enrolled for this event."},
                    status=status.HTTP_200_OK
                )
                
            except Event.DoesNotExist:
                return Response(
                    {"detail": "Event not found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# ============================================================================
# EVENT-SPECIFIC TEAM MANAGEMENT
# ============================================================================

class EventTeamListCreate(generics.ListCreateAPIView):
    """List and create teams for a specific event"""
    serializer_class = EnrollSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        event_id = self.kwargs['event_id']
        today = date.today()
        
        try:
            event = Event.objects.get(id=event_id, date__gte=today)
            return TeamEnroll.objects.filter(event=event).select_related('event').prefetch_related('players')
        except Event.DoesNotExist:
            return TeamEnroll.objects.none()


class EventTeamDelete(generics.DestroyAPIView):
    """Delete a team enrollment"""
    serializer_class = EnrollSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        event_id = self.kwargs['event_id']
        today = date.today()
        
        try:
            event = Event.objects.get(
                id=event_id, 
                approval_status='approved',
                date__gte=today
            )
            return TeamEnroll.objects.filter(event=event)
        except Event.DoesNotExist:
            return TeamEnroll.objects.none()


# ============================================================================
# KHALTI ePAYMENT INITIATE (Step 1)
# Docs: https://docs.khalti.com/khalti-epayment/
# ============================================================================
# backend/enroll/views.py - REPLACE PaymentInitiateView with this

class PaymentInitiateView(generics.CreateAPIView):
    """
    Khalti ePayment Initiate API - FIXED VERSION
    POST /api/enroll/payments/khalti/initiate/
    """
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        print("\n" + "="*80)
        print("💳 KHALTI PAYMENT INITIATION")
        print("="*80)
        
        try:
            # Log authentication
            print(f"✅ User authenticated: {request.user.username} (ID: {request.user.id})")
            
            # Get request data
            enrollment_data = request.data.get('enrollment_data')
            event_id = request.data.get('event_id')
            
            print(f"📥 Event ID: {event_id}")
            print(f"📥 Has enrollment data: {bool(enrollment_data)}")
            
            if not enrollment_data or not event_id:
                print("❌ Missing required data")
                return Response(
                    {'error': 'enrollment_data and event_id required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get event (with transaction lock)
            with transaction.atomic():
                try:
                    event = Event.objects.select_for_update().get(id=event_id)
                    print(f"✅ Event: {event.name}")
                    print(f"   Payment amount: {event.payment}")
                except Event.DoesNotExist:
                    print("❌ Event not found")
                    return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
                
                # Check enrollment availability
                can_enroll, message = event.can_enroll()
                if not can_enroll:
                    print(f"❌ Cannot enroll: {message}")
                    return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if free event
                is_free = (
                    not event.payment or 
                    str(event.payment).lower() == 'free' or
                    float(event.payment) == 0
                )
                
                if is_free:
                    print("⚠️ This is a free event - should use direct enrollment")
                    return Response(
                        {'error': 'This event is free - use direct enrollment'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Age validation: if event is "Under X", ensure players are within limit
                players_data = enrollment_data.get('players', [])
                is_valid, err_msg = validate_players_age_for_event(players_data, event)
                if not is_valid:
                    print(f"❌ Age validation failed: {err_msg}")
                    return Response({'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)
                
                # Generate reference ID
                reference_id = str(uuid.uuid4())
                print(f"🔑 Reference ID: {reference_id}")
                
                # Store enrollment data in session
                session_key = f'enrollment_data_{reference_id}'
                request.session[session_key] = {
                    'enrollment_data': enrollment_data,
                    'event_id': event_id,
                    'user_id': request.user.id
                }
                request.session.modified = True
                print(f"💾 Session key: {session_key}")
                
                # Create payment record
                payment = Payment.objects.create(
                    enrollment=None,
                    amount=event.payment,
                    reference_id=reference_id,
                    status='pending'
                )
                print(f"✅ Payment record created: ID {payment.id}")
                
                # Convert amount to paisa
                try:
                    amount_in_paisa = int(float(event.payment) * 100)
                    print(f"💰 Amount: Rs. {event.payment} = {amount_in_paisa} paisa")
                except (ValueError, TypeError) as e:
                    print(f"❌ Invalid amount: {event.payment}")
                    return Response(
                        {'error': f'Invalid payment amount: {event.payment}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Prepare customer info
                customer_name = getattr(request.user, 'name', request.user.username)
                customer_email = request.user.email or "noreply@himalayab.com"
                customer_phone = getattr(request.user, 'phone', '9800000000')
                
                print(f"👤 Customer: {customer_name}")
                print(f"📧 Email: {customer_email}")
                print(f"📱 Phone: {customer_phone}")
                
                # Prepare Khalti payload
                payload = {
                    "return_url": f"{settings.SITE_URL}/payment/",
                    "website_url": settings.SITE_URL,
                    "amount": amount_in_paisa,
                    "purchase_order_id": reference_id,
                    "purchase_order_name": f"Team Enrollment - {event.name}",
                    "customer_info": {
                        "name": customer_name,
                        "email": customer_email,
                        "phone": customer_phone
                    }
                }
                
                print("\n📤 KHALTI API REQUEST:")
                print(f"   URL: {settings.KHALTI_INITIATE_URL}")
                print(f"   Payload: {json.dumps(payload, indent=2)}")
                
                # Prepare headers
                headers = {
                    'Authorization': f'Key {settings.KHALTI_SECRET_KEY}',
                    'Content-Type': 'application/json',
                }
                
                # Only show partial key for security (first 15 chars)
                print(f"   Auth: Key {settings.KHALTI_SECRET_KEY[:15]}...")
                
                # Call Khalti API
                print("\n🌐 Calling Khalti API...")
                
                try:
                    response = requests.post(
                        settings.KHALTI_INITIATE_URL,
                        json=payload,
                        headers=headers,
                        timeout=30
                    )
                    
                    print(f"\n📥 Khalti Response:")
                    print(f"   Status: {response.status_code}")
                    print(f"   Body: {response.text[:500]}")
                    
                except requests.exceptions.Timeout:
                    print("❌ Khalti API timeout")
                    return Response(
                        {'error': 'Payment gateway timeout. Please try again.'}, 
                        status=status.HTTP_504_GATEWAY_TIMEOUT
                    )
                except requests.exceptions.RequestException as e:
                    print(f"❌ Request error: {str(e)}")
                    return Response(
                        {'error': f'Payment gateway error: {str(e)}'}, 
                        status=status.HTTP_502_BAD_GATEWAY
                    )
                
                # Parse response
                if response.status_code == 200:
                    try:
                        result = response.json()
                        pidx = result.get('pidx')
                        payment_url = result.get('payment_url')
                        
                        print(f"✅ Success!")
                        print(f"   pidx: {pidx}")
                        print(f"   payment_url: {payment_url}")
                        
                        if not pidx or not payment_url:
                            print("❌ Missing pidx or payment_url")
                            return Response(
                                {'error': 'Invalid response from payment gateway', 'details': result}, 
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR
                            )
                        
                        # Update payment record
                        payment.pidx = pidx
                        payment.save()
                        
                        print("="*80 + "\n")
                        
                        return Response({
                            'success': True,
                            'pidx': pidx,
                            'payment_url': payment_url,
                            'reference_id': reference_id,
                            'amount': float(event.payment)
                        }, status=status.HTTP_200_OK)
                        
                    except json.JSONDecodeError as e:
                        print(f"❌ JSON decode error: {str(e)}")
                        return Response(
                            {'error': 'Invalid JSON from payment gateway'}, 
                            status=status.HTTP_502_BAD_GATEWAY
                        )
                else:
                    # Khalti returned an error
                    try:
                        error_data = response.json()
                    except:
                        error_data = {'error': response.text[:200]}
                    
                    print(f"❌ Khalti API Error {response.status_code}:")
                    print(f"   {json.dumps(error_data, indent=2)}")
                    print("="*80 + "\n")
                    
                    # Check for specific Khalti errors
                    error_msg = 'Payment gateway error'
                    help_text = ''
                    
                    if response.status_code == 400:
                        error_msg = 'Invalid payment details'
                    elif response.status_code == 401:
                        error_msg = 'Payment gateway authentication failed - Invalid secret key'
                        help_text = 'Please verify your Khalti secret key. For sandbox: Get keys from https://test-admin.khalti.com (Login OTP: 987654)'
                    elif response.status_code == 403:
                        error_msg = 'Payment not authorized'
                    
                    return Response(
                        {
                            'error': error_msg,
                            'help': help_text,
                            'details': error_data,
                            'status_code': response.status_code
                        }, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
        
        except Exception as e:
            print(f"\n❌ UNEXPECTED ERROR:")
            print(f"   Type: {type(e).__name__}")
            print(f"   Message: {str(e)}")
            import traceback
            print(f"   Traceback:\n{traceback.format_exc()}")
            print("="*80 + "\n")
            
            return Response(
                {'error': 'Server error', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ============================================================================
# KHALTI ePAYMENT LOOKUP/VERIFY (Step 2)
# Docs: https://docs.khalti.com/khalti-epayment/#lookup-api
# ============================================================================

class PaymentVerifyView(generics.CreateAPIView):
    """
    Khalti ePayment Lookup API
    POST /api/enroll/payment/verify/
    
    This is called AFTER user completes payment on Khalti
    Request: {pidx}
    Response: {success, team_id, payment_id}
    """
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        try:
            pidx = request.data.get('pidx')
            
            if not pidx:
                return Response(
                    {'error': 'pidx is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get payment record
            try:
                payment = Payment.objects.get(pidx=pidx)
            except Payment.DoesNotExist:
                return Response(
                    {'error': 'Payment not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if already processed
            if payment.status == 'success':
                return Response({
                    'success': True,
                    'message': 'Payment already verified',
                    'team_id': payment.enrollment.id if payment.enrollment else None
                }, status=status.HTTP_200_OK)
            
            # ✅ KHALTI LOOKUP API CALL
            lookup_payload = {
                "pidx": pidx
            }
            
            headers = {
                'Authorization': f'Key {settings.KHALTI_SECRET_KEY}',
                'Content-Type': 'application/json',
            }
            
            logger.info(f"🔍 Verifying payment with Khalti: pidx={pidx}")
            
            # Call Khalti Lookup API
            response = requests.post(
                settings.KHALTI_VERIFY_URL,
                json=lookup_payload,
                headers=headers,
                timeout=15
            )
            
            logger.info(f"📥 Khalti verify response: {response.status_code}")
            logger.info(f"📥 Khalti verify body: {response.text}")
            
            if response.status_code != 200:
                logger.error(f"❌ Khalti verification failed: {response.text}")
                return Response(
                    {'error': 'Payment verification failed'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = response.json()
            
            # Check payment status from Khalti
            payment_status = result.get('status')  # Should be "Completed"
            
            if payment_status != 'Completed':
                logger.warning(f"⚠️ Payment status is {payment_status}, not Completed")
                return Response(
                    {'error': f'Payment status: {payment_status}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # ✅ PAYMENT VERIFIED - Create enrollment
            # Get enrollment data from session
            session_key = f'enrollment_data_{payment.reference_id}'
            stored_data = request.session.get(session_key)
            
            if not stored_data:
                logger.error(f"❌ Enrollment data not found in session: {session_key}")
                return Response(
                    {'error': 'Enrollment data expired. Please try again.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            enrollment_data = stored_data.get('enrollment_data')
            event_id = stored_data.get('event_id')
            
            # Lock event and verify still available
            event = Event.objects.select_for_update().get(id=event_id)
            can_enroll, message = event.can_enroll()
            
            if not can_enroll:
                logger.error(f"⚠️ Event full after payment: {event.id}")
                # Payment successful but event full - refund needed
                payment.status = 'failed'
                payment.save()
                return Response(
                    {'error': f'Cannot enroll: {message}. Contact support for refund.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create enrollment
            enrollment_data['event'] = event.id
            enrollment_data['coach'] = request.user.id
            
            serializer = EnrollSerializer(data=enrollment_data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            team = serializer.save()
            
            # Update payment record
            payment.enrollment = team
            payment.status = 'success'
            payment.khalti_txn_id = result.get('transaction_id') or result.get('idx')
            payment.paid_at = timezone.now()
            payment.save()
            
            # Clear session
            if session_key in request.session:
                del request.session[session_key]
            
            logger.info(f"✅ Payment verified and enrollment created: Team {team.id}, Payment {payment.id}")
            
            return Response({
                'success': True,
                'team_id': team.id,
                'payment_id': payment.id,
                'transaction_id': payment.khalti_txn_id,
                'message': 'Payment verified and team enrolled successfully'
            }, status=status.HTTP_201_CREATED)
        
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            logger.exception(f"❌ Validation error: {e.detail}")
            return Response({'error': str(e.detail)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"❌ Error verifying payment: {str(e)}")
            return Response(
                {'error': f'Server error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================================
# PAYMENT STATUS CHECK
# ============================================================================

class PaymentStatusView(generics.RetrieveAPIView):
    """Check payment status"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, reference_id, *args, **kwargs):
        try:
            payment = Payment.objects.get(reference_id=reference_id)
            return Response({
                'status': payment.status,
                'amount': float(payment.amount),
                'enrollment_id': payment.enrollment.id if payment.enrollment else None,
                'paid_at': payment.paid_at
            })
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


# ============================================================================
# ADMIN PAYMENT MANAGEMENT ENDPOINTS
# ============================================================================

class AdminPaymentListView(generics.ListAPIView):
    """Admin view to list all payments"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        queryset = Payment.objects.select_related('enrollment', 'enrollment__event').all().order_by('-created_at')
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Filter by enrollment/event
        enrollment_id = self.request.query_params.get('enrollment', None)
        if enrollment_id:
            queryset = queryset.filter(enrollment_id=enrollment_id)
        
        # Search by reference_id, khalti_txn_id, or team name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(reference_id__icontains=search) |
                Q(khalti_txn_id__icontains=search) |
                Q(enrollment__team_name__icontains=search)
            )
        
        return queryset


class AdminPaymentDetailView(generics.RetrieveAPIView):
    """Admin view to retrieve payment details"""
    queryset = Payment.objects.select_related('enrollment', 'enrollment__event').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdmin]


class AdminPaymentUpdateView(generics.UpdateAPIView):
    """Admin view to update payment (for manual corrections)"""
    queryset = Payment.objects.all()
    serializer_class = AdminPaymentSerializer
    permission_classes = [IsAdmin]
    
    def perform_update(self, serializer):
        # Admin can manually update payment status if needed
        # If status is being set to 'success', update paid_at
        if 'status' in serializer.validated_data:
            if serializer.validated_data['status'] == 'success' and not serializer.instance.paid_at:
                serializer.validated_data['paid_at'] = timezone.now()
        serializer.save()

