from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/events/', include('events.urls')),
    path('api/enroll/', include('enroll.urls')),
    path('api/', include('accounts.urls')),  # This handles all account-related endpoints
    path('auth/', include('social_django.urls', namespace='social')),
    path('', lambda request: JsonResponse({'message': 'Welcome to Himalaya API'})),
]