from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.common.models import TimeStampedModel

class College(TimeStampedModel):
    """
    Represents an educational institution.
    Acts as the tenant for multi-tenancy.
    """
    name = models.CharField(_('college name'), max_length=255)
    code = models.CharField(_('college code'), max_length=50, unique=True)
    address = models.TextField(_('address'), blank=True)
    
    # Contact info
    contact_email = models.EmailField(_('contact email'))
    contact_phone = models.CharField(_('contact phone'), max_length=20)

    class Meta:
        verbose_name = _('college')
        verbose_name_plural = _('colleges')

    def __str__(self):
        return f"{self.name} ({self.code})"

class Batch(TimeStampedModel):
    """
    Represents an admission year/batch (e.g., "Batch 2026").
    """
    name = models.CharField(_('batch name'), max_length=50) # e.g. "2022-2026" or "Batch 2022"
    year = models.IntegerField(_('start year'))
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='batches')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['college', 'year'], name='unique_batch_per_college')
        ]
        ordering = ['-year']

    def __str__(self):
        return f"{self.name} ({self.college.code})"

class Department(TimeStampedModel):
    """
    Represents a functional department (e.g., CSE, ECE) within a Batch.
    """
    name = models.CharField(_('department name'), max_length=100)
    code = models.CharField(_('department code'), max_length=20)
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='departments')
    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name='departments',
        null=True,
        blank=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['college', 'batch', 'code'],
                name='unique_dept_code_per_batch'
            )
        ]
        indexes = [
            models.Index(fields=['batch'], name='dept_batch_idx'),
        ]

    def __str__(self):
        batch_str = self.batch.name if self.batch else 'No Batch'
        return f"{self.name} ({self.code}) - {batch_str}"

class Teacher(TimeStampedModel):
    """
    Teacher Profile linked to User.
    OneToOne relationship ensures one user is one teacher.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='teacher_profile'
    )
    # Teacher department can be string or FK. Keeping string for now as per plan, 
    # but could be FK to Department model if strict relation needed.
    department = models.CharField(_('department'), max_length=100) 
    designation = models.CharField(_('designation'), max_length=100)

    def __str__(self):
        return f"Prof. {self.user.last_name} ({self.department})"

class Student(TimeStampedModel):
    """
    Student Profile linked to User.
    Now linked to Batch and Department.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='student_profile'
    )
    # Replaced simple integer with ForeignKey to Batch
    batch = models.ForeignKey(
        Batch, 
        on_delete=models.PROTECT, 
        related_name='students',
        null=True, # Allow null temporarily for migration compatibility
        blank=True
    )
    # Linked to Department
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='students',
        null=True, # Allow null temporarily
        blank=True
    )
    
    # We remove batch_year as per plan
    # batch_year = models.IntegerField(_('batch year'), null=True, blank=True)
    
    semester = models.IntegerField(_('current semester'), default=1)
    
    # Profile Info
    bio = models.TextField(_('bio'), blank=True, null=True)
    resume = models.FileField(_('resume upload'), upload_to='resumes/', blank=True, null=True)
    
    # Additional fields like DOB, Blood Group can go here if not in User

    def __str__(self):
        batch_str = self.batch.name if self.batch else "No Batch"
        return f"{self.user.first_name} {self.user.last_name} ({batch_str})"

class Subject(TimeStampedModel):
    """
    A subject taught in a specific semester.
    """
    name = models.CharField(_('subject name'), max_length=255)
    code = models.CharField(_('subject code'), max_length=20)
    # Semester is an integer 1-8. Could choose from choices but int is fine.
    semester = models.IntegerField(_('semester'))
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='subjects')
    teacher = models.ForeignKey(
        Teacher, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='subjects_taught',
        help_text=_('Teacher assigned to this subject.')
    )
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['college', 'code'],
                name='unique_subject_code_per_college'
            )
        ]
        indexes = [
            models.Index(fields=['college', 'semester'], name='subj_college_sem_idx'),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

class Enrollment(TimeStampedModel):
    """
    Links a Student to a Subject.
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='enrollments')
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['student', 'subject'], name='unique_student_subject_enrollment')
        ]
        indexes = [
            models.Index(fields=['student', 'subject'], name='enrollment_lookup_idx'),
        ]

    def __str__(self):
        return f"{self.student} -> {self.subject}"

class Resource(TimeStampedModel):
    """
    Study materials (PDFs, Links) uploaded by teachers for a subject.
    """
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    file = models.FileField(_('file upload'), upload_to='resources/', blank=True, null=True)
    link = models.URLField(_('external link'), blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.subject.code})"
