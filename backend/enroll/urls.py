# backend/enroll/urls.py - OPTION B

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EnrollViews, PlayerViews, EventTeamsListView,
    EventTeamListCreate, EventTeamDelete,
    PaymentInitiateView, PaymentVerifyView, PaymentStatusView, test_auth,
    AdminPaymentListView, AdminPaymentDetailView, AdminPaymentUpdateView,
    AdminPlayerViews, update_player_files
)

router = DefaultRouter()
router.register(r'teams', EnrollViews, basename='team-enroll')
router.register(r'players', PlayerViews, basename='player')
router.register(r'admin/players', AdminPlayerViews, basename='admin-player')

urlpatterns = [
    path('', include(router.urls)),
    path('test-auth/', test_auth, name='test-auth'),
    # Event teams
    path('events/<int:event_id>/teams/', EventTeamsListView.as_view(), name='event-teams-list'),
    path('events/<int:event_id>/teams/create/', EventTeamListCreate.as_view(), name='event_team_list_create'),
    path('events/<int:event_id>/teams/<int:pk>/', EventTeamDelete.as_view(), name='event_team_delete'),
    
    # Khalti payment
    path('payments/khalti/initiate/', PaymentInitiateView.as_view(), name='khalti-initiate'),
    path('payments/khalti/verify/', PaymentVerifyView.as_view(), name='khalti-verify'),
    path('payments/<uuid:reference_id>/status/', PaymentStatusView.as_view(), name='check-payment-status'),
    
    # Admin payment management
    path('admin/payments/', AdminPaymentListView.as_view(), name='admin-payments-list'),
    path('admin/payments/<int:pk>/', AdminPaymentDetailView.as_view(), name='admin-payment-detail'),
    path('admin/payments/<int:pk>/update/', AdminPaymentUpdateView.as_view(), name='admin-payment-update'),
    
    # Coach player file upload
    path('players/<int:player_id>/files/', update_player_files, name='update-player-files'),
]