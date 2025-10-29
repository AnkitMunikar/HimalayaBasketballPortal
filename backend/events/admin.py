from django.contrib import admin
from django.utils import timezone
from .models import Event
from django.utils.html import format_html

class EventAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'date', 'organizer', 'approval_status', 'logo_thumbnail', 'has_receipt']
    list_editable = ['approval_status']
    list_filter = ['approval_status', 'date', 'city', 'organizer', 'duration_type', 'gender']
    search_fields = ['name', 'city', 'organizer__username', 'organizer__name']
    
    def logo_thumbnail(self, obj):
        """Show small logo thumbnail in list view"""
        if obj.logo:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit:cover; border-radius:4px;" />',
                obj.logo.url
            )
        return "❌"
    logo_thumbnail.short_description = "Logo"
    
    def has_receipt(self, obj):
        """Show checkmark if receipt exists"""
        return "✅" if obj.venue_receipt else "❌"
    has_receipt.short_description = "Receipt"
    
    def logo_preview(self, obj):
        """Large logo preview in detail view"""
        if obj.logo:
            return format_html(
                '<img src="{}" style="max-width:300px; max-height:300px; border-radius:8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" /><br>'
                '<a href="{}" target="_blank" style="margin-top:10px; display:inline-block;">Open full size</a>',
                obj.logo.url, obj.logo.url
            )
        return format_html('<span style="color:#999;">No logo uploaded</span>')
    logo_preview.short_description = "Logo Preview"
    
    def receipt_preview(self, obj):
        """PDF preview in detail view"""
        if obj.venue_receipt:
            return format_html(
                '<iframe src="{}" width="100%" height="500px" style="border:1px solid #ddd; border-radius:4px;"></iframe><br>'
                '<a href="{}" target="_blank" download style="margin-top:10px; display:inline-block;">📥 Download PDF</a>',
                obj.venue_receipt.url, obj.venue_receipt.url
            )
        return format_html('<span style="color:#999;">No receipt uploaded</span>')
    receipt_preview.short_description = "Receipt Preview"

    # Show files in the approval section
    def get_fieldsets(self, request, obj=None):
        fieldsets = [
            ('Event Details', {
                'fields': ['name', 'description', 'date', 'venue', 'city', 'organizer']
            }),
            ('Event Configuration', {
                'fields': ['gender', 'level', 'duration_type', 'payment']
            }),
            ('Event Materials', {
                'fields': ['logo_preview', 'logo', 'receipt_preview', 'venue_receipt'],
                'description': 'Upload event logo and venue receipt for verification'
            }),
            ('Approval Status', {
                'fields': ['approval_status', 'rejection_reason'],
                'classes': ['wide']
            }),
        ]
        
        if obj and obj.approved_by:
            fieldsets.append(
                ('Approval History', {
                    'fields': ['approved_by', 'approved_at'],
                    'classes': ['collapse']
                })
            )
        
        return fieldsets
    
    def get_readonly_fields(self, request, obj=None):
        readonly = ['logo_preview', 'receipt_preview']
        if obj and obj.approved_by:
            readonly.extend(['approved_by', 'approved_at'])
        return readonly
    
    # Only show organizer field to superusers in list
    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if not request.user.is_superuser:
            # Remove organizer from non-superusers
            return [f for f in fields if f != 'organizer']
        return fields
    
    def save_model(self, request, obj, form, change):
        if not change:  # New event
            obj.organizer = request.user
        
        # Auto-set approval tracking
        if change and 'approval_status' in form.changed_data:
            if obj.approval_status == 'approved':
                obj.approved_by = request.user
                obj.approved_at = timezone.now()
                obj.rejection_reason = None
            elif obj.approval_status == 'rejected':
                obj.approved_by = None
                obj.approved_at = None
            else:  # pending
                obj.approved_by = None
                obj.approved_at = None
                obj.rejection_reason = None
        
        super().save_model(request, obj, form, change)

admin.site.register(Event, EventAdmin)