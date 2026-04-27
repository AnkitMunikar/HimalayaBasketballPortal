# backend/enroll/admin.py - OPTION B (NO VERIFICATION)

from django.contrib import admin
from .models import TeamEnroll, Player, Payment
from django.utils.html import format_html


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = [
        'player_name', 'age', 'dob', 'position', 'teamenroll',
        'photo_badge', 'document_badge'
    ]
    list_filter = ['position', 'created_at']
    search_fields = ['player_name', 'teamenroll__team_name']
    readonly_fields = ['created_at', 'updated_at', 'photo_preview', 'document_preview']
    
    fieldsets = (
        ('Player Info', {
            'fields': ('player_name', 'age', 'dob', 'position', 'jersey_no', 'teamenroll')
        }),
        ('Files', {
            'fields': ('player_photo', 'photo_preview', 'id_proof', 'document_preview')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def photo_badge(self, obj):
        if obj.player_photo:
            return format_html(
                '<img src="{}" width="40" height="40" style="border-radius:50%; object-fit:cover;" />',
                obj.player_photo.url
            )
        return "❌"
    photo_badge.short_description = "Photo"
    
    def document_badge(self, obj):
        return "✅ PDF" if obj.id_proof else "❌"
    document_badge.short_description = "Document"
    
    def photo_preview(self, obj):
        if obj.player_photo:
            return format_html(
                '<img src="{}" style="max-width:300px; max-height:300px; border-radius:8px;" />',
                obj.player_photo.url
            )
        return "No photo"
    photo_preview.short_description = "Photo Preview"
    
    def document_preview(self, obj):
        if obj.id_proof:
            return format_html(
                '<a href="{}" target="_blank" class="button">📄 Download PDF</a><br><br>'
                '<iframe src="{}" width="100%" height="500px" style="border:1px solid #ddd; border-radius:4px;"></iframe>',
                obj.id_proof.url, obj.id_proof.url
            )
        return "No document"
    document_preview.short_description = "Document Preview"


@admin.register(TeamEnroll)
class TeamEnrollAdmin(admin.ModelAdmin):
    list_display = [
        'team_name', 'coach_name', 'event', 'players_count',
        'gender', 'created_at'
    ]
    list_filter = ['event', 'gender', 'created_at']
    search_fields = ['team_name', 'coach_name', 'email']
    readonly_fields = ['created_at', 'players_info']
    
    fieldsets = (
        ('Team Info', {
            'fields': ('team_name', 'gender', 'coach_name', 'contact_number', 'email', 'event', 'team')
        }),
        ('Players', {
            'fields': ('players_info',)
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )
    
    def players_count(self, obj):
        return obj.players.count()
    players_count.short_description = "Players"
    
    def players_info(self, obj):
        players = obj.players.all()
        if not players:
            return "No players"
        
        info = '<table style="width:100%; border-collapse:collapse; border:1px solid #ddd;">'
        info += '<tr style="background:#f0f0f0; font-weight:bold;">'
        info += '<th style="border:1px solid #ddd; padding:10px;">Name</th>'
        info += '<th style="border:1px solid #ddd; padding:10px;">Age</th>'
        info += '<th style="border:1px solid #ddd; padding:10px;">DOB</th>'
        info += '<th style="border:1px solid #ddd; padding:10px;">Pos</th>'
        info += '<th style="border:1px solid #ddd; padding:10px;">Jersey</th>'
        info += '<th style="border:1px solid #ddd; padding:10px;">Photo</th>'
        info += '<th style="border:1px solid #ddd; padding:10px;">Doc</th>'
        info += '</tr>'
        
        for player in players:
            photo = '✅' if player.player_photo else '❌'
            doc = '✅' if player.id_proof else '❌'
            
            info += '<tr style="border:1px solid #ddd;">'
            info += f'<td style="border:1px solid #ddd; padding:10px;">{player.player_name}</td>'
            info += f'<td style="border:1px solid #ddd; padding:10px; text-align:center;">{player.age}</td>'
            info += f'<td style="border:1px solid #ddd; padding:10px; text-align:center;">{player.dob}</td>'
            info += f'<td style="border:1px solid #ddd; padding:10px; text-align:center;">{player.position}</td>'
            info += f'<td style="border:1px solid #ddd; padding:10px; text-align:center;">{player.jersey_no or "-"}</td>'
            info += f'<td style="border:1px solid #ddd; padding:10px; text-align:center;">{photo}</td>'
            info += f'<td style="border:1px solid #ddd; padding:10px; text-align:center;">{doc}</td>'
            info += '</tr>'
        
        info += '</table>'
        return format_html(info)
    players_info.short_description = "Players Details"


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['reference_id', 'enrollment', 'amount', 'status', 'created_at', 'paid_at']
    list_filter = ['status', 'created_at']
    search_fields = ['reference_id', 'khalti_txn_id', 'enrollment__team_name']
    readonly_fields = ['reference_id', 'created_at', 'paid_at']
    
    fieldsets = (
        ('Payment', {
            'fields': ('enrollment', 'amount', 'status')
        }),
        ('Khalti', {
            'fields': ('khalti_txn_id', 'pidx', 'reference_id')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'paid_at')
        })
    )