# backend/enroll/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnrollViews, PlayerViews, EventTeamsListView, EventTeamListCreate, EventTeamDelete

router = DefaultRouter()
router.register(r'teams', EnrollViews, basename='team-enroll')
router.register(r'players', PlayerViews, basename='player')

urlpatterns = [
    path('', include(router.urls)),
    path('events/<int:event_id>/teams/', EventTeamsListView.as_view(), name='event-teams-list'),
    path('events/<int:event_id>/teams/', EventTeamListCreate.as_view(), name='event_team_list_create'),
    path('events/<int:event_id>/teams/<int:pk>/', EventTeamDelete.as_view(), name='event_team_delete'),
]