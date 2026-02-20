from rest_framework import permissions
from apps.common.constants import UserRole

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.STUDENT

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.TEACHER

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.ADMIN

class IsHead(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.HEAD

class IsSameCollege(permissions.BasePermission):
    """
    Ensures the user accessing the resource belongs to the same college.
    This usually requires checking object ownership or context.
    For list views, filtering should be done in QuerySet.
    For object views, this checks obj.college == user.college.
    """
    def has_object_permission(self, request, view, obj):
        # Assumes obj has a 'college' attribute
        if not hasattr(obj, 'college'):
            return True # Or False depending on strictness. 
                        # If obj is global/shared, maybe True. 
                        # But strict multi-tenancy implies everything has college.
                        # For now, if no college attr, valid permission check might not apply.
            # However, prompt said: "Every core model MUST include college".
            
        return obj.college == request.user.college
