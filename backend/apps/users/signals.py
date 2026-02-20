from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from apps.common.constants import UserRole
from apps.academics.models import Student, Teacher

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create a Student or Teacher profile when a new User is created.
    Batch and department are set later by the serializer.
    """
    if created:
        if instance.role == UserRole.STUDENT:
            Student.objects.create(user=instance, semester=1)
        elif instance.role == UserRole.TEACHER:
            Teacher.objects.create(user=instance, department="General", designation="Lecturer")

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    """
    Ensure the profile is saved when the user is saved.
    """
    if instance.role == UserRole.STUDENT:
        if hasattr(instance, 'student_profile'):
            instance.student_profile.save()
    elif instance.role == UserRole.TEACHER:
        if hasattr(instance, 'teacher_profile'):
            instance.teacher_profile.save()

