# backend/registration/views.py
from rest_framework import viewsets
from .models import TeamEnroll , Player
from .serializers import EnrollSerializer, PlayerSerializer

class EnrollViews(viewsets.ModelViewSet):
    queryset = TeamEnroll.objects.all()
    serializer_class = EnrollSerializer

class PlayerViews(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
