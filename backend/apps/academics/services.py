from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Enrollment, Subject, Student

class AcademicService:
    @staticmethod
    def enroll_student(student, subject):
        """
        Enrolls a student in a subject.
        Validates that student and subject belong to the same college.
        """
        if student.user.college != subject.college:
            raise ValidationError("Student and Subject must belong to the same college.")
        
        # Check if already enrolled
        if Enrollment.objects.filter(student=student, subject=subject).exists():
            raise ValidationError("Student is already enrolled in this subject.")

        with transaction.atomic():
            enrollment = Enrollment.objects.create(student=student, subject=subject)
            return enrollment

    @staticmethod
    def assign_teacher_to_subject(teacher, subject):
        """
        Assigns a teacher to a subject.
        Validates college match.
        """
        if teacher.user.college != subject.college:
            raise ValidationError("Teacher and Subject must belong to the same college.")
        
        subject.teacher = teacher
        subject.save()
        return subject

    @staticmethod
    def bulk_enroll(subject, student_ids):
        """
        Bulk enroll/sync students for a subject.
        Creates new enrollments, deactivates removed ones.
        """
        with transaction.atomic():
            # Deactivate enrollments not in the new list
            Enrollment.objects.filter(
                subject=subject, is_active=True
            ).exclude(
                student_id__in=student_ids
            ).update(is_active=False)

            # Create or reactivate enrollments in the list
            for sid in student_ids:
                enrollment, created = Enrollment.objects.get_or_create(
                    student_id=sid, subject=subject,
                    defaults={'is_active': True}
                )
                if not created and not enrollment.is_active:
                    enrollment.is_active = True
                    enrollment.save(update_fields=['is_active'])

        # Return updated list
        return Enrollment.objects.select_related(
            'student__user', 'subject'
        ).filter(subject=subject, is_active=True)
