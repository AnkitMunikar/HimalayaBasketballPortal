from django.urls import path
from .views import (
    RegisterView, LogoutView,
    OrganizerTeamListCreate, OrganizerEventListCreate,
    CoachTeamListCreate, CoachEventList,
    PlayerEventList, PlayerList,
    get_user   # 👈 add this
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Authentication endpoints
    path('signup/', RegisterView.as_view(), name='signup'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', get_user, name='user'),   # 👈 NEW ENDPOINT
    
    # Event Organizer endpoints
    path('organizer/teams/', OrganizerTeamListCreate.as_view(), name='organizer_teams'),
    path('organizer/events/', OrganizerEventListCreate.as_view(), name='organizer_events'),
    
    # Coach endpoints
    path('coach/teams/', CoachTeamListCreate.as_view(), name='coach_teams'),
    path('coach/events/', CoachEventList.as_view(), name='coach_events'),
    
    # Player endpoints
    path('player/events/', PlayerEventList.as_view(), name='player_events'),
    path('players/', PlayerList.as_view(), name='player_list'),
]
