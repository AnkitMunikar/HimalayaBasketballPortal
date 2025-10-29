# backend/accounts/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import Team
from events.models import Event
from enroll.models import TeamEnroll
from events.serializers import EventSerializer
from .serializers import RegisterSerializer, TeamSerializer, UserSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from .permissions import IsEventOrganizer, IsCoach, IsPlayer
from rest_framework.decorators import api_view, permission_classes, action, throttle_classes
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from .utils import send_verification_email, send_password_reset_email
import uuid

# Custom throttle classes
class PasswordResetThrottle(AnonRateThrottle):
    scope = 'password_reset'

class VerificationThrottle(AnonRateThrottle):
    scope = 'verification'

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    throttle_classes = [AnonRateThrottle]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Create user but keep them inactive until email verification
            user = serializer.save(is_active=False)
            
            # Send verification email
            email_sent = send_verification_email(user)
            
            if email_sent:
                return Response({
                    "message": "Registration successful! Please check your email to verify your account.",
                    "email": user.email,
                    "verification_required": True
                }, status=status.HTTP_201_CREATED)
            else:
                # Delete user if email cannot be sent
                user.delete()
                return Response({
                    "error": "Email could not be sent. Please check your email address and try again.",
                    "email": request.data.get('email')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ✨ Email Verification View
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify user's email using the token sent via email
    """
    token = request.query_params.get('token')  # For GET request
    if request.method == 'POST':
        token = request.data.get('token')  # For POST request
    
    if not token:
        return Response(
            {"error": "Verification token is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Convert string token to UUID
        token_uuid = uuid.UUID(token)
        user = get_user_model().objects.get(email_verification_token=token_uuid)
        
        # Check if already verified
        if user.is_email_verified:
            return Response(
                {"message": "Email already verified. You can login now."},
                status=status.HTTP_200_OK
            )
        
        # Check if token is expired
        if not user.is_verification_token_valid():
            return Response(
                {"error": "Verification link has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the user
        user.is_email_verified = True
        user.is_active = True  # Allow user to login
        user.save(update_fields=['is_email_verified', 'is_active'])
        
        return Response({
            "message": "Email verified successfully! You can now login.",
            "user": {
                "username": user.username,
                "email": user.email,
                "name": user.name
            }
        }, status=status.HTTP_200_OK)
        
    except (ValueError, get_user_model().DoesNotExist):
        return Response(
            {"error": "Invalid verification token"},
            status=status.HTTP_400_BAD_REQUEST
        )

# ✨ Resend Verification Email View
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([VerificationThrottle])
def resend_verification_email(request):
    """
    Resend verification email to user
    """
    email = request.data.get('email')
    
    if not email:
        return Response(
            {"error": "Email is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = get_user_model().objects.get(email=email)
        
        # Check if already verified
        if user.is_email_verified:
            return Response(
                {"message": "Email is already verified"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate new token and send email
        user.generate_verification_token()
        email_sent = send_verification_email(user)
        
        if email_sent:
            return Response(
                {"message": "Verification email sent successfully. Please check your inbox."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "Failed to send email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except get_user_model().DoesNotExist:
        # Don't reveal if email exists or not (security)
        return Response(
            {"message": "If the email exists, a verification link has been sent."},
            status=status.HTTP_200_OK
        )

# ✨ CustomTokenObtainPairView to check email verification
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # Try to authenticate
        username = request.data.get('username')
        
        try:
            user = get_user_model().objects.get(username=username)
            
            # Check if email is verified
            if not user.is_email_verified:
                return Response({
                    "error": "Please verify your email before logging in. Check your inbox for the verification link.",
                    "email": user.email,
                    "verification_required": True
                }, status=status.HTTP_403_FORBIDDEN)
            
        except get_user_model().DoesNotExist:
            pass  # Let the parent class handle invalid credentials
        
        # Continue with normal authentication
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_200_OK:
            user = get_user_model().objects.get(username=request.data['username'])
            user_data = UserSerializer(user).data
            response.data['user'] = user_data
        
        return response

class OrganizerTeamListCreate(generics.ListCreateAPIView):
    serializer_class = TeamSerializer
    permission_classes = [IsEventOrganizer]
    
    def get_queryset(self):
        return Team.objects.all().select_related('coach')

class OrganizerEventListCreate(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsEventOrganizer]
    
    def get_queryset(self):
        return Event.objects.filter(organizer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

class CoachTeamListCreate(generics.ListCreateAPIView):
    serializer_class = TeamSerializer
    permission_classes = [IsCoach]
    
    def get_queryset(self):
        return Team.objects.filter(coach=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(coach=self.request.user)

class CoachTeamDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TeamSerializer
    permission_classes = [IsCoach]
    
    def get_queryset(self):
        return Team.objects.filter(coach=self.request.user)

class CoachEventList(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsCoach]
    
    def get_queryset(self):
        return Event.objects.filter(approval_status='approved').order_by('-date')

class PlayerEventList(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsPlayer]
    
    def get_queryset(self):
        return Event.objects.filter(approval_status='approved').order_by('-date')

class PlayerList(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return get_user_model().objects.filter(role='player')

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_email_verified": user.is_email_verified,
    })

class AdminEventListView(generics.ListAPIView):
    """Admin view to see all events regardless of approval status"""
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == 'admin':
            return Event.objects.all().order_by('-id')
        elif user.role == 'event_organizer':
            return Event.objects.filter(organizer=user).order_by('-id')
        else:
            return Event.objects.filter(is_approved=True).order_by('-id')

class AdminEventUpdateView(generics.RetrieveUpdateAPIView):
    """Admin can update any event"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_event(request, event_id):
    """Quick approve an event"""
    try:
        event = Event.objects.get(pk=event_id)
        event.is_approved = True
        event.save()
        return Response({'status': 'approved'}, status=status.HTTP_200_OK)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_event(request, event_id):
    """Quick reject an event"""
    try:
        event = Event.objects.get(pk=event_id)
        event.is_approved = False
        event.save()
        return Response({'status': 'rejected'}, status=status.HTTP_200_OK)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

@action(detail=False, methods=['get'], url_path='debug-coach')
def debug_coach_data(self, request):
    """Temporary debugging endpoint"""
    user = request.user
    if not user.is_authenticated:
        return Response({'error': 'Not authenticated'})
    
    all_enrollments = TeamEnroll.objects.all()
    user_enrollments = TeamEnroll.objects.filter(coach_name=user.name)
    
    return Response({
        'user_name': user.name,
        'user_role': user.role,
        'total_enrollments': all_enrollments.count(),
        'user_enrollments_count': user_enrollments.count(),
        'all_coach_names': list(all_enrollments.values_list('coach_name', flat=True).distinct()),
    })

# 🔐 NEW: Forgot Password View
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def forgot_password(request):
    # """
    # Request a password reset email
    
    # STEP 1 of password reset flow:
    # - User enters their email
    # - System generates reset token
    # - System sends email with reset link
    
    # Security: Always return success message, even if email doesn't exist
    # This prevents attackers from discovering valid email addresses
    # """
    serializer = ForgotPasswordSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    
    try:
        # Try to find user by email
        user = get_user_model().objects.get(email=email)
        
        # Generate password reset token
        user.generate_password_reset_token()
        
        # Send reset email
        email_sent = send_password_reset_email(user)
        
        if not email_sent:
            # Email failed to send but don't tell user the real reason
            print(f"Failed to send password reset email to {email}")
        
    except get_user_model().DoesNotExist:
        # User doesn't exist, but don't reveal that
        print(f"Password reset requested for non-existent email: {email}")
        pass
    
    # ALWAYS return the same message for security
    return Response({
        "message": "If that email address is registered, we've sent a password reset link. Please check your inbox."
    }, status=status.HTTP_200_OK)


# 🔐 NEW: Verify Reset Token View (Optional but helpful)
@api_view(['GET'])
@permission_classes([AllowAny])
def verify_reset_token(request):
    """
    Check if a password reset token is valid
    
    This is OPTIONAL but useful for frontend to show:
    - "Valid link" or "Expired link" message
    - Before user fills out the new password form
    
    Frontend calls this when user lands on reset password page
    """
    token = request.query_params.get('token')
    
    if not token:
        return Response(
            {"error": "Token is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        token_uuid = uuid.UUID(token)
        user = get_user_model().objects.get(password_reset_token=token_uuid)
        
        # Check if token is valid
        if user.is_password_reset_token_valid():
            return Response({
                "valid": True,
                "message": "Token is valid. You can proceed to reset your password.",
                "email": user.email  # Show email so user knows which account
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "valid": False,
                "error": "This password reset link has expired. Please request a new one."
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except (ValueError, get_user_model().DoesNotExist):
        return Response({
            "valid": False,
            "error": "Invalid password reset link."
        }, status=status.HTTP_400_BAD_REQUEST)


    """
    Actually reset the user's password
    
    STEP 2 of password reset flow:
    - User submits new password with token
    - System validates token
    - System updates password
    - System marks token as used
    
    After this, user must login with new password
    """
# 🔐 NEW: Reset Password View
@api_view(['GET', 'POST'])  # ✅ Changed from ['POST'] to ['GET', 'POST']
@permission_classes([AllowAny])
def reset_password(request):
    """
    Reset password endpoint
    
    GET: When user clicks email link (show form or redirect to frontend)
    POST: When user submits new password
    """
    
    # Handle GET request (user clicked email link)
    if request.method == 'GET':
        token = request.query_params.get('token')
        
        if not token:
            return Response({
                "error": "Token is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            token_uuid = uuid.UUID(token)
            user = get_user_model().objects.get(password_reset_token=token_uuid)
            
            # Check if token is valid
            if user.is_password_reset_token_valid():
                # Redirect to frontend with token
                from django.shortcuts import redirect
                return redirect(f"http://127.0.0.1:8000/api/reset-password/{token}")
            else:
                return Response({
                    "error": "This password reset link has expired. Please request a new one."
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except (ValueError, get_user_model().DoesNotExist):
            return Response({
                "error": "Invalid password reset link"
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle POST request (user submitting new password)
    serializer = ResetPasswordSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Get user from context
    user = serializer.context.get('user')
    
    if not user:
        return Response({
            "error": "Invalid request"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Update password
    new_password = serializer.validated_data['new_password']
    user.set_password(new_password)
    
    # Mark token as used
    user.mark_password_reset_used()
    
    print(f"Password reset successful for user: {user.email}")
    
    return Response({
        "message": "Password reset successful! You can now login with your new password.",
        "redirect_to_login": True
    }, status=status.HTTP_200_OK)