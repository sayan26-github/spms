from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from django.utils.translation import gettext_lazy as _
from .models import User

class AuthService:
    @staticmethod
    def authenticate_user(registration_number, password, college_code=None):
        """
        Authenticates a user based on registration_number and password.
        Handles multi-tenancy: if registration_number is not unique globaly,
        college_code is required to disambiguate.
        """
        # Try to find the user first
        try:
            if college_code:
                user = User.objects.get(registration_number=registration_number, college__code=college_code)
            else:
                try:
                    user = User.objects.get(registration_number=registration_number)
                except MultipleObjectsReturned:
                    raise ValueError(_("Multiple users found with this ID. Please provide college code."))
        except ObjectDoesNotExist:
            return None # User not found

        # check password
        if user.check_password(password):
            return user
        return None

    @staticmethod
    def get_tokens_for_user(user):
        refresh = RefreshToken.for_user(user)
        
        # Add custom claims
        refresh['role'] = user.role
        refresh['college'] = user.college.code
        refresh['name'] = f"{user.first_name} {user.last_name}"

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': user.role,
            'name': f"{user.first_name} {user.last_name}",
            'first_name': user.first_name,
            'last_name': user.last_name,
            'college': user.college.code,
        }

    @staticmethod
    def change_password(user, old_password, new_password):
        if not user.check_password(old_password):
            return False, _("Wrong old password.")
        
        user.set_password(new_password)
        user.must_change_password = False # Reset flag
        user.save()
        return True, _("Password changed successfully.")
