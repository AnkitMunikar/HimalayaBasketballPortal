from django.urls import path
from .views import EventCreateView, EventListView

urlpatterns = [
    path('create/', EventCreateView.as_view(), name='event-create'),
    path('list/', EventListView.as_view(), name='event-list'),  # ✅ Add this
]
