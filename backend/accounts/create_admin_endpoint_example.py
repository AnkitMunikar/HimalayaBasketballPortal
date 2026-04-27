"""
Optional: Add this to accounts/views.py if you want admins to create other admin users
via the frontend admin panel
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from accounts.permissions import IsAdmin
from django.contrib.auth import get_user_model

@api_view(['POST'])
@permission_classes([IsAdmin])
def create_admin_user(request):
    """
    Admin-only endpoint to create new admin users
    Bypasses email verification requirement
    """
    User = get_user_model()
    
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name', '')
    
    # Validation
    if not username or not email or not password:
        return Response(
            {'error': 'Username, email, and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create admin user
    admin_user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role='admin',
        name=name,
        is_active=True,
        is_email_verified=True,  # Skip verification for admin users
        is_staff=False,  # False unless they need Django admin access
        is_superuser=False  # False unless they need all Django permissions
    )
    
    from accounts.serializers import AdminUserSerializer
    serializer = AdminUserSerializer(admin_user)
    
    return Response({
        'message': 'Admin user created successfully',
        'user': serializer.data
    }, status=status.HTTP_201_CREATED)
