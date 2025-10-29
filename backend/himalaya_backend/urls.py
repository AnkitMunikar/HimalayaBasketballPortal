from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/events/', include('events.urls')),
    path('api/enroll/', include('enroll.urls')),
    path('api/', include('accounts.urls')),  # This handles all account-related endpoints
    path('auth/', include('social_django.urls', namespace='social')),
    path('', lambda request: JsonResponse({'message': 'Welcome to Himalaya API'})),
    # path('api/accounts/', include('accounts.urls')),

]

# ✅ IMPORTANT: Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)