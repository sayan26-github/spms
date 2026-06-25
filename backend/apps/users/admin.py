from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User

class CustomUserAdmin(UserAdmin):
    """
    Admin configuration for CustomUser.
    """
    ordering = ['email']
    list_display = ['registration_number', 'email', 'first_name', 'last_name', 'role', 'college', 'is_staff']
    list_filter = ['role', 'college', 'is_staff', 'is_active']
    search_fields = ['registration_number', 'first_name', 'last_name', 'email']
    
    # Fieldsets for user editing form
    fieldsets = (
        (None, {'fields': ('registration_number', 'password')}),
        (_('Personal Info'), {'fields': ('first_name', 'last_name', 'email', 'phone_number')}),
        (_('College Info'), {'fields': ('college', 'role')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important Dates'), {'fields': ('last_login',)}),
        (_('Security'), {'fields': ('must_change_password',)}),
    )
    
    # Fieldsets for user creation form
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('registration_number', 'college', 'role', 'password1', 'password2'),
        }),
    )

    # Since we use registration_number as USERNAME_FIELD, we don't need to override
    # too much logic if handled correctly, but UserAdmin expects 'username' in some places.
    # We might need to handle form validation if we used a custom form, but for basic
    # functionality, this configuration aligns fields.

admin.site.register(User, CustomUserAdmin)
