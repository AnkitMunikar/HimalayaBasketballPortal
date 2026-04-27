"""
Check and optionally update your superuser for frontend admin access
Run: python manage.py shell < check_admin_user.py
"""

from django.contrib.auth import get_user_model

User = get_user_model()

# Get your superuser (adjust username if different)
try:
    admin_user = User.objects.filter(is_superuser=True).first()
    
    if admin_user:
        print(f"Found superuser: {admin_user.username}")
        print(f"  Email: {admin_user.email}")
        print(f"  is_superuser: {admin_user.is_superuser}")
        print(f"  role: {admin_user.role}")
        print(f"  is_email_verified: {admin_user.is_email_verified}")
        print(f"  is_active: {admin_user.is_active}")
        print(f"\n✅ This user can access frontend admin (is_superuser=True)")
        
        # Optional: Set role to 'admin' for consistency
        if admin_user.role != 'admin':
            print(f"\n⚠️  Role is currently '{admin_user.role}' (not 'admin')")
            print("Setting role to 'admin' for consistency...")
            admin_user.role = 'admin'
            admin_user.is_email_verified = True  # Ensure email verification is set
            admin_user.save()
            print("✅ Role updated to 'admin'")
        else:
            print(f"✅ Role is already 'admin'")
            
        # Ensure email verification is set
        if not admin_user.is_email_verified:
            print("\n⚠️  Email not verified - setting is_email_verified=True...")
            admin_user.is_email_verified = True
            admin_user.save()
            print("✅ Email verification set to True")
        
        print(f"\n🎉 Your superuser is ready to use with the frontend admin!")
        print(f"   Username: {admin_user.username}")
        print(f"   You can login at: POST /api/login/")
        
    else:
        print("❌ No superuser found. Create one with: python manage.py createsuperuser")
        
except Exception as e:
    print(f"Error: {e}")
