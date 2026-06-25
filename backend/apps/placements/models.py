from django.db import models
from django.conf import settings

class Company(models.Model):
    college = models.ForeignKey('academics.College', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    tier = models.CharField(max_length=50, choices=[('Tier 1', 'Tier 1'), ('Tier 2', 'Tier 2'), ('Tier 3', 'Tier 3')], default='Tier 2')
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['college', 'name'], name='unique_company_per_college')
        ]

    def __str__(self):
        return f"{self.name} ({self.tier})"


class JobPosting(models.Model):
    JOB_TYPES = [
        ('FULL_TIME', 'Full-Time'),
        ('INTERNSHIP', 'Internship'),
        ('PART_TIME', 'Part-Time'),
    ]

    college = models.ForeignKey('academics.College', on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='postings')
    title = models.CharField(max_length=255)
    description = models.TextField()
    job_type = models.CharField(max_length=50, choices=JOB_TYPES, default='FULL_TIME')
    min_gpa = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    ctc = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="CTC in LPA")
    is_active = models.BooleanField(default=True)
    deadline = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['company', 'title'], name='unique_job_per_company')
        ]

    def __str__(self):
        return f"{self.title} at {self.company.name}"


class Skill(models.Model):
    college = models.ForeignKey('academics.College', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['college', 'name'], name='unique_skill_per_college')
        ]

    def __str__(self):
        return self.name


class JobSkill(models.Model):
    college = models.ForeignKey('academics.College', on_delete=models.CASCADE)
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='required_skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)

    class Meta:
        ordering = ['id']
        constraints = [
            models.UniqueConstraint(fields=['job', 'skill'], name='unique_skill_per_job')
        ]


class StudentSkill(models.Model):
    college = models.ForeignKey('academics.College', on_delete=models.CASCADE)
    student = models.ForeignKey('academics.Student', on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    proficiency = models.IntegerField(default=3, help_text="Scale 1 to 5")

    class Meta:
        ordering = ['id']
        constraints = [
            models.UniqueConstraint(fields=['student', 'skill'], name='unique_skill_per_student')
        ]


class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('APPLIED', 'Applied'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEWED', 'Interviewed'),
        ('OFFERED', 'Offered'),
        ('REJECTED', 'Rejected')
    ]

    college = models.ForeignKey('academics.College', on_delete=models.CASCADE)
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applications')
    student = models.ForeignKey('academics.Student', on_delete=models.CASCADE, related_name='applications')
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-applied_at']
        constraints = [
            models.UniqueConstraint(fields=['job', 'student'], name='unique_application_per_student_job')
        ]

    def __str__(self):
        return f"{self.student.user.get_full_name()} -> {self.job.title}"
