from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimeStampedModel
from apps.common.constants import UserRole
from apps.users.managers import CustomUserManager

class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Custom User model supporting multi-tenancy via College.
    """
    registration_number = models.CharField(
        _('registration number'), 
        max_length=50,
        help_text=_('Unique ID for student/teacher within a college.')
    )
    college = models.ForeignKey(
        'academics.College', 
        on_delete=models.CASCADE,
        related_name='users',
        help_text=_('College this user belongs to.')
    )
    role = models.CharField(
        _('role'), 
        max_length=20, 
        choices=UserRole.choices, 
        default=UserRole.STUDENT
    )
    
    # Personal Info
    first_name = models.CharField(_('first name'), max_length=150, blank=True)
    last_name = models.CharField(_('last name'), max_length=150, blank=True)
    email = models.EmailField(_('email address'), blank=True)
    phone_number = models.CharField(_('phone number'), max_length=15, blank=True)
    
    # Auth flags
    is_staff = models.BooleanField(
        _('staff status'),
        default=False,
        help_text=_('Designates whether the user can log into this admin site.'),
    )
    is_active = models.BooleanField(
        _('active'),
        default=True,
        help_text=_('Designates whether this user should be treated as active.'),
    )
    must_change_password = models.BooleanField(
        _('must change password'),
        default=True,
        help_text=_('If True, user is forced to change password on next login.')
    )

    username = models.CharField(
        _('username'),
        max_length=255,
        unique=True,
        help_text=_('Global unique identifier (College Code + Reg No). Auto-generated.')
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email'] # removed college from required fields for createsuperuser to work potentially or need custom manage command

    def save(self, *args, **kwargs):
        # Auto-generate username/uniqueness
        # We need college to be set.
        if self.college_id and self.registration_number:
            expected_username = f"{self.college.code}_{self.registration_number}"
            if self.username != expected_username:
                self.username = expected_username
        
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        constraints = [
            models.UniqueConstraint(
                fields=['college', 'registration_number'], 
                name='unique_user_per_college'
            )
        ]
        indexes = [
            models.Index(fields=['college', 'registration_number'], name='user_college_reg_idx'),
            models.Index(fields=['role'], name='user_role_idx'),
        ]

    def get_full_name(self):
        """
        Return the first_name plus the last_name, with a space in between.
        """
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()

    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name



    def __str__(self):
        return f"{self.registration_number} ({self.get_role_display()}) - {self.college.code}"

    @property
    def is_student(self):
        return self.role == UserRole.STUDENT

    @property
    def is_teacher(self):
        return self.role == UserRole.TEACHER

    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN

    @property
    def is_head(self):
        return self.role == UserRole.HEAD
