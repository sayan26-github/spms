from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Assessment, Marks
from decimal import Decimal
from apps.academics.models import Student
from apps.attendance.models import Attendance
from apps.common.constants import AttendanceStatus

def get_grade_and_points(percentage):
    if percentage >= 90: return 'O', 10
    if percentage >= 80: return 'A+', 9
    if percentage >= 70: return 'A', 8
    if percentage >= 60: return 'B+', 7
    if percentage >= 50: return 'B', 6
    if percentage >= 40: return 'C', 5
    return 'F', 0

class AssessmentService:
    @staticmethod
    def bulk_add_marks(assessment, marks_data):
        """
        Bulk adds marks for a specific assessment.
        marks_data: list of dicts [{'student_id': 1, 'marks': 85.5}, ...]
        """
        # 1. Get list of student IDs from input
        student_ids = [item.get('student_id') for item in marks_data if item.get('student_id')]
        
        # 2. Validate that these students are enrolled in the subject
        # Filtering by subject__enrollments ensures they are valid students for this subject
        valid_student_ids = set(
            assessment.subject.enrollments.filter(
                student_id__in=student_ids, 
                is_active=True
            ).values_list('student_id', flat=True)
        )

        with transaction.atomic():
            for record in marks_data:
                student_id = record.get('student_id')
                marks_obtained = record.get('marks')
                remarks = record.get('remarks', '')

                if student_id and marks_obtained is not None:
                    if student_id not in valid_student_ids:
                        # Skip or raise error? skipping for bulk leniency, or could log.
                        # For strictness, let's skip but maybe we should warn.
                        continue

                    # Use update_or_create to handle re-uploads
                    Marks.objects.update_or_create(
                        assessment=assessment,
                        student_id=student_id,
                        defaults={
                            'marks_obtained': marks_obtained,
                            'remarks': remarks
                        }
                    )

        # Trigger async ML prediction recalculation for affected students
        if valid_student_ids:
            from apps.analytics.services import AnalyticsService
            AnalyticsService.trigger_ml_update_async(list(valid_student_ids))

        return True

    @staticmethod
    def grade_submission(submission, marks, remarks=None):
        """
        Grades an assignment submission.
        """
        if marks is not None:
            marks = float(marks)
            if marks > float(submission.assignment.max_marks) or marks < 0:
                raise ValidationError(f"Marks must be between 0 and {submission.assignment.max_marks}")
            submission.marks_obtained = marks
        
        if remarks is not None:
            submission.remarks = remarks
        submission.save()
        return submission

    @staticmethod
    def generate_student_transcript(student_id):
        student = Student.objects.select_related('user', 'department', 'batch').get(id=student_id)
        
        marks_qs = Marks.objects.filter(student=student).select_related('assessment', 'assessment__subject')
        
        semester_data = {}
        total_grade_points = 0
        total_subjects = 0
        
        for mark in marks_qs:
            sem = mark.assessment.subject.semester
            subj_id = mark.assessment.subject.id
            
            if sem not in semester_data:
                semester_data[sem] = {
                    'semester': sem,
                    'subjects': {},
                    'total_grade_points': 0,
                    'subject_count': 0,
                    'attendance_present': 0,
                    'attendance_total': 0
                }
                
            if subj_id not in semester_data[sem]['subjects']:
                semester_data[sem]['subjects'][subj_id] = {
                    'code': mark.assessment.subject.code,
                    'name': mark.assessment.subject.name,
                    'obtained': Decimal('0.0'),
                    'max': Decimal('0.0')
                }
                
            semester_data[sem]['subjects'][subj_id]['obtained'] += mark.marks_obtained
            semester_data[sem]['subjects'][subj_id]['max'] += mark.assessment.max_marks

        for sem, data in semester_data.items():
            for subj_id, subj in data['subjects'].items():
                pct = (subj['obtained'] / subj['max']) * 100 if subj['max'] > 0 else Decimal('0.0')
                
                grade, points = get_grade_and_points(pct)
                subj['grade'] = grade
                subj['grade_points'] = points
                subj['percentage'] = float(pct)
                
                data['total_grade_points'] += points
                data['subject_count'] += 1
                total_grade_points += points
                total_subjects += 1
                
            data['sgpa'] = round(data['total_grade_points'] / data['subject_count'], 2) if data['subject_count'] > 0 else 0
            data['subjects'] = list(data['subjects'].values())

        attendance_qs = Attendance.objects.filter(student=student).select_related('class_session__subject')
        overall_present = 0
        overall_total = 0
        
        for att in attendance_qs:
            sem = att.class_session.subject.semester
            if sem not in semester_data:
                semester_data[sem] = {
                    'semester': sem, 'subjects': [], 'total_grade_points': 0,
                    'subject_count': 0, 'attendance_present': 0, 'attendance_total': 0, 'sgpa': 0
                }
            
            semester_data[sem]['attendance_total'] += 1
            overall_total += 1
            if att.status == AttendanceStatus.PRESENT:
                semester_data[sem]['attendance_present'] += 1
                overall_present += 1

        for sem, data in semester_data.items():
            if data['attendance_total'] > 0:
                data['attendance_percentage'] = round((data['attendance_present'] / data['attendance_total']) * 100, 2)
            else:
                data['attendance_percentage'] = 0.0

        cgpa = round(total_grade_points / total_subjects, 2) if total_subjects > 0 else 0
        overall_att = round((overall_present / overall_total) * 100, 2) if overall_total > 0 else 0
        
        semesters_list = [semester_data[k] for k in sorted(semester_data.keys())]

        return {
            'student': {
                'id': student.id,
                'name': f"{student.user.first_name} {student.user.last_name}",
                'registration_number': student.user.registration_number,
                'department': student.department.name if student.department else 'N/A',
                'batch': student.batch.name if student.batch else 'N/A'
            },
            'overall_cgpa': cgpa,
            'overall_attendance_percentage': overall_att,
            'semesters': semesters_list
        }
