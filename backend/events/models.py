# backend/events/models.py
from django.db import models
from django.conf import settings

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

    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    name = models.CharField(max_length=100, verbose_name="Tournament Name")
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    venue = models.CharField(max_length=100)
    city = models.CharField(max_length=50, help_text="City where the event takes place")
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organized_events'
    )
    created_at = models.DateTimeField(auto_now_add=True)
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
        default='Free'
    )
    logo = models.ImageField(
        upload_to='event_logos/', 
        blank=True, null=True,
          help_text="Event logo image")
    venue_receipt = models.FileField(
        upload_to='venue_receipts/', 
        blank=True, null=True, 
         help_text="Upload venue rental receipt for confirmation")
    
    # Updated approval system
    approval_status = models.CharField(
        max_length=10, 
        choices=APPROVAL_STATUS_CHOICES, 
        default='pending'
    )
    rejection_reason = models.TextField(blank=True, null=True, help_text="Reason for rejection")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_events'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Keep the old field for backward compatibility
    is_approved = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # Sync is_approved with approval_status for backward compatibility
        self.is_approved = (self.approval_status == 'approved')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.city} ({self.get_approval_status_display()})"

    @property
    def is_pending(self):
        return self.approval_status == 'pending'
    
    @property
    def is_rejected(self):
        return self.approval_status == 'rejected'