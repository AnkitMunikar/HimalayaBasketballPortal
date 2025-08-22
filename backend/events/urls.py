# events/urls.py
from django.urls import path
from .views import EventCreateView, EventListView

urlpatterns = [
    path('', EventListView.as_view(), name='events-list-root'),  # /api/events/ returns list
    path('create/', EventCreateView.as_view(), name='event-create'),  # /api/events/create/
    path('list/', EventListView.as_view(), name='event-list'),   # /api/events/list/ (duplicate but kept for compatibility)
]