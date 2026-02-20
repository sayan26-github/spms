from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from apps.common.models import TimeStampedModel
from apps.common.constants import AssessmentType
from apps.academics.models import Subject, Student

class Assessment(TimeStampedModel):
    """
    Represents an examination, test, or assignment.
    """
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assessments')
    name = models.CharField(_('assessment name'), max_length=100) # e.g. "Unit Test 1"
    assessment_type = models.CharField(
        _('type'), 
        max_length=20, 
        choices=AssessmentType.choices,
        default=AssessmentType.QUIZ
    )
    max_marks = models.DecimalField(_('max marks'), max_digits=5, decimal_places=2)
    weightage = models.DecimalField(_('weightage %'), max_digits=5, decimal_places=2, default=0.00)
    date = models.DateField(_('assessment date'))
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['subject', 'name', 'date'], name='unique_assessment_per_subject')
        ]
        ordering = ['-date']

    def __str__(self):
        return f"{self.subject.code} - {self.name} ({self.date})"

class Marks(TimeStampedModel):
    """
    Marks obtained by a student in an assessment.
    """
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='marks')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='marks')
    marks_obtained = models.DecimalField(_('marks obtained'), max_digits=5, decimal_places=2)
    remarks = models.CharField(_('remarks'), max_length=255, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['assessment', 'student'], name='unique_marks_per_assessment')
        ]
        indexes = [
            models.Index(fields=['assessment', 'marks_obtained'], name='assessment_marks_idx'),
            models.Index(fields=['student', 'assessment'], name='student_marks_lookup_idx'),
        ]

    def clean(self):
        # Validate marks <= max_marks
        if self.marks_obtained > self.assessment.max_marks:
             raise ValidationError(f"Marks obtained ({self.marks_obtained}) cannot exceed max marks ({self.assessment.max_marks}).")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} - {self.marks_obtained}/{self.assessment.max_marks}"
