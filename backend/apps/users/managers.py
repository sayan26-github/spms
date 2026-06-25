from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    """
    Custom user manager where registration_number is the unique identifiers
    for authentication instead of usernames.
    """
    def create_user(self, registration_number, college, password, **extra_fields):
        """
        Create and save a User with the given registration_number and password.
        """
        if not registration_number:
            raise ValueError(_('The Registration Number must be set'))
        if not college:
            raise ValueError(_('The College must be set'))
        
        user = self.model(
            registration_number=registration_number, 
            college=college, 
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, registration_number, password, **extra_fields):
        """
        Create and save a SuperUser with the given registration_number and password.
        Note: Superusers might not belong to a specific college in some designs,
        but for strict Schema, we might need a dummy college or nullable.
        For now, we assume superuser creation might fail if college is enforced 
        strictly in DB without default.
        However, for CLI usage, we often need to bypass or provide college.
        Let's allow nullable college for ADMINS if designed so, but strictly 
        User model says college is Foreign Key.
        
        So superuser compilation requires a college instance.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'ADMIN') # Default to ADMIN role

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        # Extract college from extra_fields — it must be provided
        college = extra_fields.pop('college', None)
        if not college:
            raise ValueError(_('Superuser must be assigned to a college.'))

        return self.create_user(
            registration_number, college=college,
            password=password, **extra_fields
        )
