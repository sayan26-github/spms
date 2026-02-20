from django.db import transaction
from django.core.exceptions import ValidationError
from .models import ClassSession, Attendance
from apps.academics.models import Enrollment
from apps.common.constants import AttendanceStatus

class AttendanceService:
    @staticmethod
    def create_class_session(subject, date, teacher_user, topic=''):
        """
        Creates a class session and initializes attendance records for all enrolled students.
        """
        if ClassSession.objects.filter(subject=subject, date=date).exists():
             raise ValidationError(f"Session for {subject.name} on {date} already exists.")

        with transaction.atomic():
            session = ClassSession.objects.create(
                subject=subject,
                date=date,
                created_by=teacher_user,
                topic=topic
            )
            
            # Fetch all active enrollments for this subject
            enrollments = Enrollment.objects.filter(subject=subject, is_active=True).select_related('student')
            
            attendance_records = []
            for enrollment in enrollments:
                attendance_records.append(
                    Attendance(
                        class_session=session,
                        student=enrollment.student,
                        status=AttendanceStatus.ABSENT # Default to Absent
                    )
                )
            
            # Bulk create attendance records
            if attendance_records:
                Attendance.objects.bulk_create(attendance_records)
            
            return session

    @staticmethod
    def update_attendance(session_id, attendance_data):
        """
        Updates attendance for a batch of students.
        attendance_data: list of dicts [{'student_id': 1, 'status': 'PRESENT'}, ...]
        """
        try:
            session = ClassSession.objects.get(id=session_id)
        except ClassSession.DoesNotExist:
            raise ValidationError("Session not found")

        with transaction.atomic():
            for record in attendance_data:
                student_id = record.get('student_id')
                status = record.get('status')
                
                if student_id and status:
                    Attendance.objects.update_or_create(
                        class_session=session,
                        student_id=student_id,
                        defaults={'status': status}
                    )
        return True
