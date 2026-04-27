# backend/enroll/models.py - OPTION B (NO VERIFICATION)

from django.db import models
from django.conf import settings
import uuid
from django.core.exceptions import ValidationError
from datetime import date

def validate_image_file(value):
    """Validate image is JPG or PNG"""
    ext = value.name.split('.')[-1].lower()
    if ext not in ['jpg', 'jpeg', 'png']:
        raise ValidationError('Only JPG and PNG files are allowed for photos.')
    if value.size > 5242880:  # 5MB
        raise ValidationError('Image file too large. Max 5MB.')

def validate_pdf_file(value):
    """Validate file is PDF"""
    ext = value.name.split('.')[-1].lower()
    if ext != 'pdf':
        raise ValidationError('Only PDF files are allowed for documents.')
    if value.size > 10485760:  # 10MB
        raise ValidationError('PDF file too large. Max 10MB.')


class TeamEnroll(models.Model):
    """Team enrollment for an event"""
    
    GENDER_CHOICES = [
        ('Boys', 'Boys'),
        ('Girls', 'Girls'),
        ('Boys and Girls', 'Boys and Girls'),
    ]

    team_name = models.CharField(max_length=100, verbose_name="Team Name")
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='Boys')
    coach_name = models.CharField(max_length=100, verbose_name="Coach Name")
    contact_number = models.CharField(max_length=15, verbose_name="Contact Number", blank=True)
    email = models.EmailField(verbose_name="Email Address")
    
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='team_enrollments',
        null=True,
        blank=True
    )
    
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='enrollments')
    team = models.ForeignKey('accounts.Team', on_delete=models.SET_NULL, null=True, blank=True, related_name='enrollments')
 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.team_name} - {self.event.name}"

    class Meta:
        unique_together = ['team_name', 'event']


class Player(models.Model):
    """Individual player - SIMPLE, NO VERIFICATION FIELDS"""
    
    POSITION_CHOICES = [
        ('PG', 'Point Guard'),
        ('SG', 'Shooting Guard'),
        ('SF', 'Small Forward'),
        ('PF', 'Power Forward'),
        ('C', 'Center'),
    ]
    
    # Basic Info
    teamenroll = models.ForeignKey(TeamEnroll, related_name='players', on_delete=models.CASCADE)
    player_name = models.CharField(max_length=100)
    age = models.IntegerField(editable=False)  # Auto-calculated from DOB
    position = models.CharField(max_length=2, choices=POSITION_CHOICES, default='PG')
    jersey_no = models.IntegerField(null=True, blank=True)
    
    dob = models.DateField(null=True, blank=True)  # Required for age calculation
    
    def calculate_age(self):
        """Calculate age from date of birth"""
        if not self.dob:
            return None
        today = date.today()
        age = today.year - self.dob.year - ((today.month, today.day) < (self.dob.month, self.dob.day))
        return age
    
    def save(self, *args, **kwargs):
        """Auto-calculate age from DOB before saving"""
        if self.dob:
            calculated_age = self.calculate_age()
            if calculated_age is not None:
                self.age = calculated_age
        # Note: If no DOB, age will remain as is (for existing records without DOB)
        # New records should always have DOB due to validation
        super().save(*args, **kwargs)
    
    player_photo = models.ImageField(
        upload_to='player_photos/%Y/%m/%d/',
        blank=True,  # Optional ✅
        null=True,   # Optional ✅
        validators=[validate_image_file]
    )

    id_proof = models.FileField(
        upload_to='player_documents/%Y/%m/%d/',
        blank=True,  # Optional ✅
        null=True,   # Optional ✅
        validators=[validate_pdf_file]
    )
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.player_name} - {self.teamenroll.team_name}"

    class Meta:
        ordering = ['player_name']


class Payment(models.Model):
    """Track Khalti payments for enrollments"""

    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    enrollment = models.OneToOneField(
        TeamEnroll,
        on_delete=models.CASCADE,
        related_name='khalti_payment',
        null=True,
        blank=True
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    pidx = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        unique=True
    )
 
    khalti_txn_id = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    reference_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True
    )

    status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS,
        default='pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.reference_id} - {self.status}"