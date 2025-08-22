from django.contrib import admin
from .models import CustomUser, Team  # Import from accounts app
from django.contrib.auth.admin import UserAdmin

class CustomUserAdmin(UserAdmin):
    # Add custom fields to the admin interface
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'name')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'name')}),
    )
    list_display = ['username', 'email', 'name', 'role', 'is_active', 'date_joined']
    list_filter = UserAdmin.list_filter + ('role',)

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Team)
