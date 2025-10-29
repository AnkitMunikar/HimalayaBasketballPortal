from django.core.mail import send_mail
from django.conf import settings

def test_send_email():
    try:
        send_mail(
            'Test Email from Django',
            'This is a test email from your Django application.',
            settings.DEFAULT_FROM_EMAIL,
            ['anki.mk56@gmail.com'],  # Replace with your email
            fail_silently=False,
        )
        print("Test email sent successfully! Check your inbox.")
        return True
    except Exception as e:
        print(f"Failed to send test email. Error: {str(e)}")
        return False

if __name__ == "__main__":
    import os
    import django
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'himalaya_backend.settings')
    django.setup()
    test_send_email()
