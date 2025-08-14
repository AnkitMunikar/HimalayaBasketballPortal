from django.db import models

class Event(models.Model):
    EVENT_TYPES = [
        ('League', 'League'),
        ('Tournament', 'Tournament'),
    ]

    GENDER_CHOICES = [
        ('Boys', 'Boys'),
        ('Girls', 'Girls'),
        ('Boys and Girls', 'Boys and Girls'),
    ]

    name = models.CharField(max_length=100, verbose_name="Tournament Name")
    date = models.DateField()
    venue = models.CharField(max_length=100)

    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        default='Boys'
    )

    level = models.CharField(
        max_length=50,
        help_text="e.g. Under 14, Under 20",
        default='Open'
    )

    duration_type = models.CharField(
        max_length=10,
        choices=EVENT_TYPES
    )

    payment = models.CharField(
        max_length=20,
        help_text='Enter amount in NRs or type "Free"',
        default='Free'  # ✅ Here’s the key fix
    )

    def __str__(self):
        return self.name

