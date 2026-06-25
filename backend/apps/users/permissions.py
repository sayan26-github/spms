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
        # Strict multi-tenancy: every core model must have 'college'.
        # Deny access if the attribute is missing.
        if not hasattr(obj, 'college'):
            return False
        return obj.college == request.user.college
