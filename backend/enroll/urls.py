from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnrollViews, PlayerViews, EventTeamsListView

router = DefaultRouter()
router.register(r'teams', EnrollViews, basename='team-enroll')
router.register(r'players', PlayerViews, basename='player')

urlpatterns = [
    path('', include(router.urls)),
    path('events/<int:event_id>/teams/', EventTeamsListView.as_view(), name='event-teams-list'),
]