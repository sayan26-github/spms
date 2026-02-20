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
