
# backend/himalaya_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse        

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/events/', include('events.urls')),  # ✅ This is important
    path('api/events/', include('enroll.urls')),  # ✅ This is important

    path('', lambda request: JsonResponse({'message': 'Welcome to Himalaya API'})),
]
