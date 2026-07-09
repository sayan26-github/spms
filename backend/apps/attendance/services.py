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
                college=subject.college,
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
                        college=subject.college,
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
            existing_attendances = Attendance.objects.filter(class_session=session)
            existing_map = {att.student_id: att for att in existing_attendances}
            
            to_update = []
            to_create = []
            
            for record in attendance_data:
                student_id = record.get('student_id')
                status = record.get('status')
                
                if student_id and status:
                    if student_id in existing_map:
                        att = existing_map[student_id]
                        if att.status != status:
                            att.status = status
                            to_update.append(att)
                    else:
                        to_create.append(
                            Attendance(college=session.subject.college, class_session=session, student_id=student_id, status=status)
                        )
                        
            if to_update:
                Attendance.objects.bulk_update(to_update, ['status'])
            if to_create:
                Attendance.objects.bulk_create(to_create)

        # Trigger async ML prediction recalculation for affected students
        affected_student_ids = [record.get('student_id') for record in attendance_data if record.get('student_id')]
        if affected_student_ids:
            from apps.analytics.services import AnalyticsService
            AnalyticsService.trigger_ml_update_async(affected_student_ids)

        return True
