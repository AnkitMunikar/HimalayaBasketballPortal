"""
Django settings for himalaya_backend project.
"""

import os
import environ
from pathlib import Path
from datetime import timedelta

# Initialize environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-3mre0(rpyod08x0djn%mccsw4y5r-o6i6d*eu!aly^#sp^%r8#'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
ALLOWED_HOSTS = ["*"]

# Application definition
INSTALLED_APPS = [
    # Your apps FIRST
    'accounts',
    'events',
    'enroll',
    
    # Then Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Then third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'himalaya_backend.urls'

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = True
CORS_ORIGIN_WHITELIST = (
    'http://localhost:3000',
)

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'himalaya_backend.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'himalaya_db',
        'USER': 'root',
        'PASSWORD': 'ad123',
        'HOST': '127.0.0.1',
        'PORT': '3306',
    }
}

# Cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# ✅ MEDIA FILES CONFIGURATION - THIS ENABLES FILE UPLOADS
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Authentication
AUTH_USER_MODEL = 'accounts.CustomUser'

# Password validation: min 8 chars, at least one uppercase, one digit, one special character
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {'NAME': 'accounts.validators.UppercaseValidator'},
    {'NAME': 'accounts.validators.DigitValidator'},
    {'NAME': 'accounts.validators.SpecialCharacterValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kathmandu'
USE_I18N = True
USE_TZ = True

# REST Framework Configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
        'password_reset': '3/hour',
        'verification': '5/day',
    }
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'anki.mk56@gmail.com'
EMAIL_HOST_PASSWORD = 'yvkf nyqn ezex aqdr'
DEFAULT_FROM_EMAIL = 'HIMALAYA Basketball <anki.mk56@gmail.com>'

# Frontend URL for verification links
SITE_URL = env('SITE_URL', default='http://localhost:3000')

# Token Expiry Settings
EMAIL_VERIFICATION_TOKEN_EXPIRY = 24  # hours
PASSWORD_RESET_TOKEN_EXPIRY = 1       # hours

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'events.views': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ============= KHALTI PAYMENT GATEWAY CONFIGURATION =============

# Sandbox Configuration
# IMPORTANT: For sandbox testing, get your keys from: https://test-admin.khalti.com/#/join/merchant
# Use OTP: 987654 to login to test-admin dashboard
# Get your live_secret_key from the test-admin dashboard and use it here
KHALTI_PUBLIC_KEY = env('KHALTI_PUBLIC_KEY', default='be3f1e6fc3ee49acac1377dd98f76800')  # Sandbox public key
KHALTI_SECRET_KEY = env('KHALTI_SECRET_KEY', default='8f009a846e2c4bfb80ba85c44fcb0913')  # Sandbox secret key
# Use sandbox URL for testing, production URL for live
KHALTI_BASE_URL = env('KHALTI_BASE_URL', default='https://dev.khalti.com/api/v2')  # Sandbox: https://dev.khalti.com/api/v2, Production: https://khalti.com/api/v2
KHALTI_INITIATE_URL = f'{KHALTI_BASE_URL}/epayment/initiate/'  # Payment initiation endpoint (correct endpoint)
KHALTI_VERIFY_URL = f'{KHALTI_BASE_URL}/epayment/lookup/'  # Payment verification/lookup endpoint
KHALTI_API_URL = KHALTI_VERIFY_URL  # Alias for backward compatibility
# Callback URLs (Frontend URLs where user is redirected after payment)
KHALTI_RETURN_URL = 'http://localhost:3000/payment-success'  # Frontend payment success page
KHALTI_WEBSITE_URL = 'http://localhost:3000'
