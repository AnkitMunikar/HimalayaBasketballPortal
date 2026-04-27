# backend/accounts/utils.py
from django.core.mail import send_mail
from django.conf import settings

def send_verification_email(user):
    """
    Send verification email to user with verification link
    This is for EMAIL VERIFICATION during signup
    """
    # verification_url = f"http://localhost:3000/verify-email/{user.email_verification_token}"
    # verification_url = f"http://localhost:3000/verify-email?token={user.email_verification_token}"
    # verification_url = f"http://127.0.0.1:8000/api/verify-email/?token={user.email_verification_token}"
    verification_url = f"{settings.SITE_URL}/verify-email/{user.email_verification_token}"
    
    subject = 'Verify Your Email - HIMALAYA Basketball Platform'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }}
            .content {{ background-color: white; padding: 30px; border-radius: 5px; }}
            .button {{ display: inline-block; padding: 12px 30px; background-color: #ff6b35; 
                       color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #777; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
                <h2>Welcome to HIMALAYA Basketball Portal! 🏀</h2>
                <p>Hi {user.name or user.username},</p>
                <p>Thank you for registering. Please verify your email:</p>
                
                <div style="text-align: center;">
                    <a href="{verification_url}" class="button">Verify Email Address</a>
                </div>
                
                <p>Or copy this link: <span style="color: #0066cc;">{verification_url}</span></p>
                <p><strong>Expires in 24 hours</strong></p>
                
                <p>Best regards,<br>HIMALAYA Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        send_mail(
            subject=subject,
            message=f"Verify your email: {verification_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False


# 🔐 NEW: Password Reset Email Function
def send_password_reset_email(user):
    """
    Send password reset email to user
    This is for FORGOT PASSWORD functionality
    """
    # Frontend URL where user will enter new password (token in query so frontend can show the form)
    reset_url = f"{settings.SITE_URL}/reset-password?token={user.password_reset_token}"
    
    subject = 'Reset Your Password - HIMALAYA Basketball Platform'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }}
            .content {{ background-color: white; padding: 30px; border-radius: 5px; }}
            .button {{ display: inline-block; padding: 12px 30px; background-color: #e74c3c; 
                       color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .warning {{ background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #777; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
                <h2>🔐 Password Reset Request</h2>
                <p>Hi {user.name or user.username},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset Password</a>
                </div>
                
                <p>Or copy this link: <span style="color: #0066cc;">{reset_url}</span></p>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong>
                    <ul>
                        <li>This link expires in <strong>1 hour</strong></li>
                        <li>This link can only be used <strong>once</strong></li>
                        <li>If you didn't request this, please ignore this email</li>
                    </ul>
                </div>
                
                <p>For security reasons, we recommend:</p>
                <ul>
                    <li>Use a strong, unique password</li>
                    <li>Don't share your password with anyone</li>
                    <li>Enable two-factor authentication if available</li>
                </ul>
                
                <p>Best regards,<br>HIMALAYA Team</p>
            </div>
            <div class="footer">
                <p>If you didn't request a password reset, your account is still secure.</p>
                <p>© 2024 HIMALAYA Basketball Portal</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Password Reset Request
    
    Hi {user.name or user.username},
    
    Click this link to reset your password:
    {reset_url}
    
    This link expires in 1 hour and can only be used once.
    
    If you didn't request this, ignore this email.
    
    Best regards,
    HIMALAYA Team
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"Password reset email sent to {user.email}")
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False


# 🎯 NEW: Event Rejection Email Function
def send_event_rejection_email(event, rejection_reason=''):
    """
    Send rejection email to event organizer when event is rejected
    """
    organizer = event.organizer
    
    subject = f'Event Rejected: {event.name} - HIMALAYA Basketball Platform'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }}
            .content {{ background-color: white; padding: 30px; border-radius: 5px; }}
            .alert {{ background-color: #fee; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0; }}
            .event-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #777; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
                <h2>❌ Event Rejection Notice</h2>
                <p>Hi {organizer.name or organizer.username},</p>
                
                <div class="alert">
                    <strong>Your event submission has been reviewed and unfortunately, it has been rejected.</strong>
                </div>
                
                <div class="event-details">
                    <h3>Event Details:</h3>
                    <p><strong>Event Name:</strong> {event.name}</p>
                    <p><strong>Date:</strong> {event.date}</p>
                    <p><strong>Venue:</strong> {event.venue}, {event.city}</p>
                </div>
                
                {f'<div class="alert"><strong>Rejection Reason:</strong><br>{rejection_reason}</div>' if rejection_reason else ''}
                
                <p>Please review the rejection reason above and make necessary corrections. You can resubmit your event after addressing the issues mentioned.</p>
                
                <p>If you have any questions or need clarification, please contact our support team.</p>
                
                <p>Best regards,<br>HIMALAYA Team</p>
            </div>
            <div class="footer">
                <p>© 2024 HIMALAYA Basketball Portal</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Event Rejection Notice
    
    Hi {organizer.name or organizer.username},
    
    Your event submission has been reviewed and unfortunately, it has been rejected.
    
    Event Details:
    - Event Name: {event.name}
    - Date: {event.date}
    - Venue: {event.venue}, {event.city}
    
    {f'Rejection Reason: {rejection_reason}' if rejection_reason else 'No specific reason provided.'}
    
    Please review the rejection reason and make necessary corrections. You can resubmit your event after addressing the issues mentioned.
    
    Best regards,
    HIMALAYA Team
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[organizer.email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"Event rejection email sent to {organizer.email}")
        return True
    except Exception as e:
        print(f"Error sending event rejection email: {e}")
        return False