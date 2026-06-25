from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from django.utils.translation import gettext_lazy as _
from .models import User
from apps.academics.models import College
from apps.common.constants import UserRole

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

        response_data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': user.role,
            'name': f"{user.first_name} {user.last_name}",
            'first_name': user.first_name,
            'last_name': user.last_name,
            'college': user.college.code,
        }

        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            profile = user.student_profile
            response_data['batch'] = profile.batch.name if profile.batch else 'N/A'
            response_data['department'] = profile.department.name if profile.department else 'N/A'

        return response_data

    @staticmethod
    def change_password(user, old_password, new_password):
        if not user.check_password(old_password):
            return False, _("Wrong old password.")
        
        user.set_password(new_password)
        user.must_change_password = False # Reset flag
        user.save()
        return True, _("Password changed successfully.")


class CollegeRegistrationService:
    """Service for public college + admin registration."""

    @staticmethod
    def register_college_with_admin(validated_data):
        """
        Atomically create a College and its first Admin user.

        Args:
            validated_data: Dict with college and admin fields.

        Returns:
            Tuple of (college, admin_user).

        Raises:
            ValueError: If college code already exists.
        """
        college_code = validated_data['college_code'].upper().strip()

        if College.objects.filter(code=college_code).exists():
            raise ValueError(
                f'College with code "{college_code}" already exists.'
            )

        with transaction.atomic():
            college = College.objects.create(
                name=validated_data['college_name'].strip(),
                code=college_code,
                contact_email=validated_data.get('contact_email', ''),
                contact_phone=validated_data.get('contact_phone', ''),
                address=validated_data.get('address', ''),
            )

            admin_user = User.objects.create_superuser(
                registration_number=validated_data['admin_registration_number'].strip(),
                password=validated_data['admin_password'],
                college=college,
                email=validated_data.get('admin_email', ''),
                first_name=validated_data.get('admin_first_name', 'Admin'),
                last_name=validated_data.get('admin_last_name', 'User'),
                role=UserRole.ADMIN,
            )

        return college, admin_user
