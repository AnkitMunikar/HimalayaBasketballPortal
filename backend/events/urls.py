from django.urls import path
from django.conf import settings
from .views import (
    EventCreateView, EventListView, OrganizerEventsView, EventDetailView,
    EventStandingsView
)
from accounts.views import AdminEventListView, AdminEventUpdateView, approve_event, reject_event

urlpatterns = [
    path('', EventListView.as_view(), name='events-list-root'),  # /api/events/ - only approved
    path('create/', EventCreateView.as_view(), name='event-create'),  # /api/events/create/
    path('list/', EventListView.as_view(), name='event-list'),   # /api/events/list/ - only approved
    path('<int:pk>/', EventDetailView.as_view(), name='event-detail'),
    path('<int:event_id>/standings/', EventStandingsView.as_view(), name='event-standings'),
    path('organizer/events/', OrganizerEventsView.as_view(), name='organizer-events'),  # organizer's own events
    path('admin/all/', AdminEventListView.as_view(), name='admin-all-events'),  # admin view - all events
    path('admin/<int:pk>/', AdminEventUpdateView.as_view(), name='admin-event-detail'),  # admin update event
    path('admin/<int:event_id>/approve/', approve_event, name='approve-event'),  # quick approve
    path('admin/<int:event_id>/reject/', reject_event, name='reject-event'),  # quick reject oakyyy
]
