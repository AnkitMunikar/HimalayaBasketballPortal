# backend/events/admin.py
from django.contrib import admin
from django.utils import timezone
from .models import Event, EventTeamStanding
from django.utils.html import format_html

class EventAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'city', 'date', 'organizer', 
        'enrollment_status',  # ✨ NEW
        'approval_status', 
        'logo_thumbnail', 
        'has_receipt'
    ]
    list_editable = ['approval_status']
    list_filter = ['approval_status', 'date', 'city', 'organizer', 'duration_type', 'gender']
    search_fields = ['name', 'city', 'organizer__username', 'organizer__name']
    
    def enrollment_status(self, obj):
        """✨ NEW: Show enrollment status in list view"""
        current = obj.current_enrollment_count
        max_teams = obj.max_teams
        
        if max_teams == 0:
            return format_html(
                '<span style="color: green;">{} enrolled (unlimited)</span>',
                current
            )
        
        percentage = (current / max_teams * 100) if max_teams > 0 else 0
        
        if percentage >= 100:
            color = 'red'
            status = f'{current}/{max_teams} FULL'
        elif percentage >= 75:
            color = 'orange'
            status = f'{current}/{max_teams}'
        else:
            color = 'green'
            status = f'{current}/{max_teams}'
        
        return format_html(
            '<span style="color: {};">{}</span>',
            color, status
        )
    enrollment_status.short_description = "Teams"
    
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
                'fields': ['name', 'description', 'date', 'end_date', 'venue', 'city', 'organizer']
            }),
            ('Event Configuration', {
                'fields': ['gender', 'level', 'duration_type', 'payment']
            }),
            # ✨ NEW: Enrollment Settings section
            ('Enrollment Settings', {
                'fields': ['max_teams'],
                'description': 'Set maximum number of teams that can enroll (0 = unlimited)'
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
        
        # ✨ NEW: Show enrollment statistics if viewing existing event
        if obj:
            fieldsets.insert(3, (
                'Enrollment Statistics', {
                    'fields': ['get_enrollment_info'],
                    'classes': ['collapse'],
                    'description': 'Current enrollment information'
                }
            ))
        
        if obj and obj.approved_by:
            fieldsets.append(
                ('Approval History', {
                    'fields': ['approved_by', 'approved_at'],
                    'classes': ['collapse']
                })
            )
        
        return fieldsets
    
    def get_enrollment_info(self, obj):
        """Display enrollment statistics in detail view"""
        if obj:
            current = obj.current_enrollment_count
            max_teams = obj.max_teams
            
            if max_teams == 0:
                info = f"<strong>{current}</strong> teams enrolled (no limit)"
            else:
                percentage = (current / max_teams * 100) if max_teams > 0 else 0
                available = obj.available_slots
                info = f"""
                <strong>{current}/{max_teams}</strong> teams enrolled ({percentage:.1f}% full)<br>
                <strong>{available}</strong> slots available
                """
                
                if obj.is_full:
                    info += '<br><span style="color:red;font-weight:bold;">⚠️ EVENT IS FULL</span>'
            
            return format_html(info)
        return "-"
    get_enrollment_info.short_description = "Current Status"
    
    def get_readonly_fields(self, request, obj=None):
        readonly = ['logo_preview', 'receipt_preview', 'get_enrollment_info']
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
    
   # REPLACE save_model method
def save_model(self, request, obj, form, change):
    if not change:  # New event
        obj.organizer = request.user

    # CRITICAL: Validate before saving
    obj.clean()  # This will raise if max_teams < current

    # Auto-set approval tracking
    if change and 'approval_status' in form.changed_data:
        if obj.approval_status == 'approved':
            obj.approved_by = request.user
            obj.approved_at = timezone.now()
            obj.rejection_reason = None
        elif obj.approval_status == 'rejected':
            obj.approved_by = None
            obj.approved_at = None
        else:
            obj.approved_by = None
            obj.approved_at = None
            obj.rejection_reason = None

    super().save_model(request, obj, form, change)

admin.site.register(Event, EventAdmin)


@admin.register(EventTeamStanding)
class EventTeamStandingAdmin(admin.ModelAdmin):
    list_display = ('event', 'team_enrollment', 'wins', 'losses', 'points_for', 'points_against')
    list_filter = ('event',)
    search_fields = ('team_enrollment__team_name', 'event__name')