from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('event_organizer', 'Event Organizer'),
        ('coach', 'Coach'),
        ('player', 'Player'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='player')
    phone = models.CharField(max_length=15, blank=True, null=True)
    name = models.CharField(max_length=100, blank=True, null=True)
   
    def __str__(self):
        return self.username

class Team(models.Model):
    name = models.CharField(max_length=100)
    coach = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'coach'})
    # Remove the direct events relationship - use through enroll app
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


