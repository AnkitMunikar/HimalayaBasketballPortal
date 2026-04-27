"""
Script to create admin users via Python shell
Usage: python manage.py shell < create_admin.py
Or: python manage.py shell, then copy-paste the code below
"""
from django.contrib.auth import get_user_model

User = get_user_model()

# Method 1: Create superuser (has all Django admin permissions + IsAdmin permission)
superuser = User.objects.create_superuser(
    username='admin',
    email='admin@himalayab.com',
    password='your_secure_password_here',
    role='admin',  # Set role to admin for frontend admin access
    name='System Administrator',
    is_email_verified=True,  # Skip email verification for admin
    is_active=True
)
print(f"Superuser created: {superuser.username}")

# Method 2: Create regular admin user (role='admin' but not superuser)
# Uncomment below if you want admin role without superuser privileges
"""
admin_user = User.objects.create_user(
    username='admin_user',
    email='admin_user@himalayab.com',
    password='your_secure_password_here',
    role='admin',
    name='Admin User',
    is_email_verified=True,
    is_active=True,
    is_staff=False,  # False means can't access Django admin panel
    is_superuser=False
)
print(f"Admin user created: {admin_user.username}")
"""
