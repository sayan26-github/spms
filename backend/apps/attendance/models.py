from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.common.models import TimeStampedModel
from apps.common.constants import AttendanceStatus
from apps.academics.models import Subject, Student, College

class ClassSession(TimeStampedModel):
    """
    Represents a single class occurrence for a subject on a specific date.
    """
    college = models.ForeignKey(College, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField(_('class date'), db_index=True)
    topic = models.CharField(_('topic covered'), max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        help_text=_('Teacher who created this session')
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['subject', 'date'], name='unique_session_per_subject_date')
        ]
        indexes = [
            models.Index(fields=['subject', 'date'], name='session_lookup_idx'),
        ]
        ordering = ['-date']

    def __str__(self):
        return f"{self.subject.code} - {self.date}"

class Attendance(TimeStampedModel):
    """
    Individual attendance record for a student in a class session.
    """
    college = models.ForeignKey(College, on_delete=models.CASCADE)
    class_session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(
        _('status'), 
        max_length=20, 
        choices=AttendanceStatus.choices, 
        default=AttendanceStatus.ABSENT
    )
    remarks = models.CharField(_('remarks'), max_length=255, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['class_session', 'student'], name='unique_attendance_per_session')
        ]
        indexes = [
            models.Index(fields=['class_session', 'status'], name='attendance_status_idx'),
            # Useful for student-wise reports
            models.Index(fields=['student', 'status'], name='student_attendance_idx'),
        ]

    def __str__(self):
        return f"{self.student} - {self.status}"
