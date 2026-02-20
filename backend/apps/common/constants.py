from django.db import models
from django.utils.translation import gettext_lazy as _

class UserRole(models.TextChoices):
    STUDENT = 'STUDENT', _('Student')
    TEACHER = 'TEACHER', _('Teacher')
    ADMIN = 'ADMIN', _('College Admin')
    HEAD = 'HEAD', _('Institutional Head')

class AttendanceStatus(models.TextChoices):
    PRESENT = 'PRESENT', _('Present')
    ABSENT = 'ABSENT', _('Absent')
    LATE = 'LATE', _('Late')
    EXCUSED = 'EXCUSED', _('Excused')

class AssessmentType(models.TextChoices):
    INTERNAL_1 = 'INTERNAL_1', _('Internal Test 1')
    INTERNAL_2 = 'INTERNAL_2', _('Internal Test 2')
    INTERNAL_3 = 'INTERNAL_3', _('Internal Test 3')
    INTERNAL_4 = 'INTERNAL_4', _('Internal Test 4')
    SEMESTER = 'SEMESTER', _('Semester Exam')
    QUIZ = 'QUIZ', _('Weekly Quiz')

class RiskLevel(models.TextChoices):
    LOW = 'LOW', _('Low Risk')
    MEDIUM = 'MEDIUM', _('Medium Risk')
    HIGH = 'HIGH', _('High Risk')

class NotificationType(models.TextChoices):
    ALERT = 'ALERT', _('Alert')
    REMINDER = 'REMINDER', _('Reminder')
    SYSTEM = 'SYSTEM', _('System Notification')
