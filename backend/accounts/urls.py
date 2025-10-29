# backend/accounts/urls.py
from django.urls import path
from .views import (
    RegisterView, LogoutView,
    OrganizerTeamListCreate, OrganizerEventListCreate,
    CoachTeamListCreate, CoachEventList,
    PlayerEventList, PlayerList, CustomTokenObtainPairView,
    get_user, verify_email, resend_verification_email,
    forgot_password, verify_reset_token, reset_password,  # 🔐 NEW IMPORTS
    AdminEventListView, AdminEventUpdateView, approve_event, reject_event
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # ============ Authentication endpoints ============
    path('signup/', RegisterView.as_view(), name='signup'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', get_user, name='user'),
    
    # ============ Email verification endpoints ============
    path('verify-email/', verify_email, name='verify-email'),
    path('resend-verification/', resend_verification_email, name='resend-verification'),
    
    # 🔐 NEW: Password reset endpoints
    path('forgot-password/', forgot_password, name='forgot-password'),
    path('verify-reset-token/', verify_reset_token, name='verify-reset-token'),
    path('reset-password/', reset_password, name='reset-password'),
    
    # ============ Event Organizer endpoints ============
    path('organizer/teams/', OrganizerTeamListCreate.as_view(), name='organizer_teams'),
    path('organizer/events/', OrganizerEventListCreate.as_view(), name='organizer_events'),
    
    # ============ Coach endpoints ============
    path('coach/teams/', CoachTeamListCreate.as_view(), name='coach_teams'),
    path('coach/events/', CoachEventList.as_view(), name='coach_events'),
    
    # ============ Player endpoints ============
    path('player/events/', PlayerEventList.as_view(), name='player_events'),
    path('players/', PlayerList.as_view(), name='player_list'),
    
    # ============ Admin/Event Approval endpoints ============
    path('admin/events/', AdminEventListView.as_view(), name='admin_events'),
    path('admin/events/<int:pk>/', AdminEventUpdateView.as_view(), name='admin_event_detail'),
    path('admin/events/<int:event_id>/approve/', approve_event, name='approve_event'),
    path('admin/events/<int:event_id>/reject/', reject_event, name='reject_event'),
]