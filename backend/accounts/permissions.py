from rest_framework.permissions import BasePermission

class IsEventOrganizer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'event_organizer'

class IsCoach(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'coach'

class IsPlayer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'player'
    
# class IsCoachOrEventOrganizer(BasePermission):
#     """Allow both coaches and event organizers to access"""
#     def has_permission(self, request, view):
#         return (request.user.is_authenticated and 
#                 request.user.role in ['coach', 'event_organizer'])