# backend/accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.utils import timezone
from datetime import timedelta

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
    
    # ✨ Email verification fields
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    
    # 🔐 NEW: Password reset fields
    password_reset_token = models.UUIDField(null=True, blank=True, unique=True)
    password_reset_sent_at = models.DateTimeField(null=True, blank=True)
    password_reset_used = models.BooleanField(default=False)
   
    def __str__(self):
        return self.username
    
    # ✨ Email Verification Methods
    def is_verification_token_valid(self):
        """Check if email verification token is still valid (within 24 hours)"""
        if not self.email_verification_sent_at:
            return False
        from django.conf import settings
        expiry_hours = getattr(settings, 'EMAIL_VERIFICATION_TOKEN_EXPIRY', 24)
        expiry_time = self.email_verification_sent_at + timedelta(hours=expiry_hours)
        return timezone.now() < expiry_time
    
    def generate_verification_token(self):
        """Generate a new email verification token"""
        self.email_verification_token = uuid.uuid4()
        self.email_verification_sent_at = timezone.now()
        self.save(update_fields=['email_verification_token', 'email_verification_sent_at'])
    
    # 🔐 NEW: Password Reset Methods
    def generate_password_reset_token(self):
        """
        Generate a new password reset token
        Used when user clicks 'Forgot Password'
        """
        self.password_reset_token = uuid.uuid4()
        self.password_reset_sent_at = timezone.now()
        self.password_reset_used = False  # Reset the used flag
        self.save(update_fields=['password_reset_token', 'password_reset_sent_at', 'password_reset_used'])
        print(f"Password reset token generated for {self.email}: {self.password_reset_token}")
    
    def is_password_reset_token_valid(self):
        """
        Check if password reset token is valid
        - Token must exist
        - Token must not be expired (1 hour expiry for security)
        - Token must not be already used
        """
        # Check if token exists
        if not self.password_reset_token or not self.password_reset_sent_at:
            print(f"Reset token invalid for {self.email}: Token or timestamp missing")
            return False
        
        # Check if token was already used
        if self.password_reset_used:
            print(f"Reset token invalid for {self.email}: Already used")
            return False
        
        # Check if token is expired (1 hour for password reset - shorter than email verification!)
        from django.conf import settings
        expiry_hours = getattr(settings, 'PASSWORD_RESET_TOKEN_EXPIRY', 1)
        expiry_time = self.password_reset_sent_at + timedelta(hours=expiry_hours)
        is_valid = timezone.now() < expiry_time
        
        print(f"Reset token check for {self.email}: Sent at {self.password_reset_sent_at}, "
              f"Expires at {expiry_time}, Now {timezone.now()}, Valid: {is_valid}")
        return is_valid
    
    def mark_password_reset_used(self):
        """
        Mark the password reset token as used
        Prevents token reuse for security
        """
        self.password_reset_used = True
        self.save(update_fields=['password_reset_used'])
        print(f"Password reset token marked as used for {self.email}")


class Team(models.Model):
    name = models.CharField(max_length=100)
    coach = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'coach'})
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name