from django.contrib import admin
from django.utils import timezone
from .models import Event

class EventAdmin(admin.ModelAdmin):
    # Show only the new approval system
    list_display = ['name', 'city', 'date', 'organizer', 'approval_status', 'approved_by', 'created_at']
    list_editable = ['approval_status']  # Only allow editing approval_status
    list_filter = ['approval_status', 'date', 'city', 'organizer', 'duration_type', 'gender']
    search_fields = ['name', 'city', 'organizer__username', 'organizer__name']
    
    # Hide is_approved from the form (it's auto-synced)
    fields = [
        'name', 'description', 'date', 'venue', 'city', 'organizer',
        'gender', 'level', 'duration_type', 'payment', 
        'approval_status', 'rejection_reason'
    ]
    
    readonly_fields = ['organizer', 'created_at']
    
    def save_model(self, request, obj, form, change):
        # Auto-set approval tracking when status changes
        if change and 'approval_status' in form.changed_data:
            if obj.approval_status == 'approved':
                obj.approved_by = request.user
                obj.approved_at = timezone.now()
                obj.rejection_reason = None  # Clear rejection reason when approved
            elif obj.approval_status == 'rejected':
                obj.approved_by = None
                obj.approved_at = None
                # Keep rejection_reason as entered by admin
            else:  # pending
                obj.approved_by = None
                obj.approved_at = None
                obj.rejection_reason = None
        super().save_model(request, obj, form, change)

    # Show additional info in the change form
    def get_readonly_fields(self, request, obj=None):
        readonly = list(self.readonly_fields)
        if obj and obj.approved_by:
            readonly.extend(['approved_by', 'approved_at'])
        return readonly

    # Custom method to show approval info
    def get_fieldsets(self, request, obj=None):
        fieldsets = [
            ('Event Details', {
                'fields': ['name', 'description', 'date', 'venue', 'city', 'organizer']
            }),
            ('Event Configuration', {
                'fields': ['gender', 'level', 'duration_type', 'payment']
            }),
            ('Approval Status', {
                'fields': ['approval_status', 'rejection_reason']
            }),
        ]
        
        if obj and obj.approved_by:
            fieldsets.append(
                ('Approval Info', {
                    'fields': ['approved_by', 'approved_at'],
                    'classes': ['collapse']
                })
            )
        
        return fieldsets

admin.site.register(Event, EventAdmin)