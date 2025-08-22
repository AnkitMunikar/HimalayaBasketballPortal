from django.contrib import admin
from .models import TeamEnroll, Player

# class PlayerInline(admin.TabularInline):
#     model = Player
#     extra = 1
#     max_num = 15

# class TeamEnrollAdmin(admin.ModelAdmin):
#     list_display = ['team_name', 'event', 'coach_name', 'gender', 'created_at']
#     list_filter = ['gender', 'event', 'created_at']
#     search_fields = ['team_name', 'coach_name', 'email']
#     inlines = [PlayerInline]

# class PlayerAdmin(admin.ModelAdmin):
#     list_display = ['player_name', 'teamenroll', 'age', 'position', 'grade']
#     list_filter = ['position', 'age', 'teamenroll__event']
#     search_fields = ['player_name', 'teamenroll__team_name']

admin.site.register(TeamEnroll)
admin.site.register(Player)