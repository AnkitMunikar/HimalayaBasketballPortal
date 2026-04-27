# backend/events/models.py
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
import os

def validate_image_extension(value):
    """Validate that the file is an image"""
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    if ext not in valid_extensions:
        raise ValidationError(f'Unsupported file extension. Allowed: {", ".join(valid_extensions)}')

def validate_pdf_extension(value):
    """Validate that the file is a PDF"""
    ext = os.path.splitext(value.name)[1].lower()
    if ext != '.pdf':
        raise ValidationError('Only PDF files are allowed for venue receipts.')

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
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Optional. Leave blank for single-day events. Used for multi-day tournaments."
    )
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
    
    # ✨ NEW: Team enrollment limit field
    max_teams = models.IntegerField(
        default=16,
        help_text="Maximum number of teams that can enroll (0 = unlimited)",
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Enhanced file fields with validation
    logo = models.ImageField(
        upload_to='event_logos/', 
        blank=True, 
        null=True,
        validators=[validate_image_extension],
        help_text="Event logo (JPG, PNG, GIF, BMP, WEBP, SVG)"
    )
    venue_receipt = models.FileField(
        upload_to='venue_receipts/', 
        blank=True, 
        null=True,
        validators=[validate_pdf_extension],
        help_text="Venue rental receipt (PDF only)"
    )
    
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
    
    @property
    def current_enrollment_count(self):
        """Get current number of enrolled teams"""
        return self.enrollments.count()
    
    @property
    def is_full(self):
        """Check if event has reached max enrollment"""
        if self.max_teams == 0:  # 0 means unlimited
            return False
        return self.current_enrollment_count >= self.max_teams
    
    @property
    def available_slots(self):
        """Get number of available slots"""
        if self.max_teams == 0:
            return None  # Unlimited
        return max(0, self.max_teams - self.current_enrollment_count)
    
    def can_enroll(self):
        """Check if new enrollments are allowed.
        Registration closes 3 days before the event date."""
        from datetime import date
        today = date.today()

        # Check if event is full
        if self.is_full:
            return False, f"Event is full ({self.max_teams} teams maximum)"

        # Check if event is approved
        if self.approval_status != 'approved':
            return False, "Event is not yet approved"

        # Registration closes 3 days before event date (cannot enroll when < 3 days left)
        days_until = (self.date - today).days
        if days_until < 3:
            return False, "Registration closed (closes 3 days before event date)"

        return True, "Enrollment allowed"
    
    # ADD THIS METHOD TO Event MODEL
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.pk:  # Only for existing events
            current = self.current_enrollment_count
            if self.max_teams > 0 and self.max_teams < current:
                raise ValidationError({
                    'max_teams': f"Cannot reduce below current enrollment ({current} teams enrolled)"
                })
    class Meta:
        indexes = [
            models.Index(fields=['approval_status']),
            models.Index(fields=['date']),
        ]

class EventTeamStanding(models.Model):
    """Standings row per team per event (Option A: manual W, L, PF, PA)."""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='standings')
    team_enrollment = models.ForeignKey(
        'enroll.TeamEnroll',
        on_delete=models.CASCADE,
        related_name='event_standings'
    )
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    points_for = models.PositiveIntegerField(default=0)
    points_against = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [['event', 'team_enrollment']]
        ordering = ['event', '-wins', '-points_for']  # rank by wins, then PF

    def __str__(self):
        return f"{self.team_enrollment.team_name} @ {self.event.name}"

    @property
    def points_diff(self):
        return self.points_for - self.points_against