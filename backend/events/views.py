# backend/events/views.py
from rest_framework import generics
from .models import Event
from .serializers import EventSerializer

class EventCreateView(generics.CreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

class EventListView(generics.ListAPIView):
    queryset = Event.objects.all().order_by('-id')  # latest first
    serializer_class = EventSerializer