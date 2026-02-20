from django.db.models import Avg, Count, Q, F
from .models import Prediction
from .ml_engine import PerformancePredictor
from apps.academics.models import Student, Subject, Batch, Department
from apps.attendance.models import Attendance, ClassSession
from apps.assessments.models import Marks, Assessment
from apps.common.constants import AttendanceStatus, RiskLevel

# Thresholds for identifying weak performance
ATTENDANCE_THRESHOLD = 75.0  # Below 75% attendance = weak
MARKS_THRESHOLD = 40.0       # Below 40% marks = weak


class AnalyticsService:
    predictor = PerformancePredictor()

    @staticmethod
    def generate_prediction_for_student(student):
        """
        Aggregates data for a student and generates a performance prediction.
        """
        total_sessions = Attendance.objects.filter(student=student).count()
        attended_sessions = Attendance.objects.filter(
            student=student, status=AttendanceStatus.PRESENT
        ).count()
        attendance_percentage = (
            (attended_sessions / total_sessions * 100)
            if total_sessions > 0 else 0
        )

        avg_marks = (
            Marks.objects.filter(student=student)
            .aggregate(Avg('marks_obtained'))['marks_obtained__avg']
            or 0
        )

        features = [attendance_percentage, float(avg_marks)]

        predicted_gpa = AnalyticsService.predictor.predict(features)
        risk_level, risk_score = AnalyticsService.predictor.calculate_risk(
            predicted_gpa
        )

        from django.utils import timezone
        today = timezone.now().date()

        prediction, created = Prediction.objects.update_or_create(
            student=student,
            prediction_date=today,
            defaults={
                'predicted_gpa': predicted_gpa,
                'risk_level': risk_level,
                'risk_score': risk_score,
                'model_version': 'v1.0'
            }
        )
        return prediction

    @staticmethod
    def run_batch_predictions(college):
        """Runs predictions for all students in a college."""
        students = Student.objects.filter(user__college=college)
        predictions = []
        for student in students:
            predictions.append(
                AnalyticsService.generate_prediction_for_student(student)
            )
        return len(predictions)

    @staticmethod
    def _get_weak_subjects_for_student(student):
        """
        Identify subjects where a student is underperforming.
        Returns a list of weak subject dicts with attendance and marks info.
        """
        enrollments = student.enrollments.filter(
            is_active=True
        ).select_related('subject__teacher__user')

        weak_subjects = []
        for enrollment in enrollments:
            subject = enrollment.subject

            # Compute attendance % for this subject
            total = ClassSession.objects.filter(subject=subject).count()
            present = Attendance.objects.filter(
                student=student,
                class_session__subject=subject,
                status=AttendanceStatus.PRESENT
            ).count()
            att_pct = (present / total * 100) if total > 0 else None

            # Compute marks % for this subject
            assessments = Assessment.objects.filter(subject=subject)
            marks_qs = Marks.objects.filter(
                student=student, assessment__in=assessments
            ).select_related('assessment')

            if marks_qs.exists():
                total_obtained = sum(m.marks_obtained for m in marks_qs)
                total_max = sum(m.assessment.max_marks for m in marks_qs)
                marks_pct = (
                    float(total_obtained / total_max * 100)
                    if total_max > 0 else None
                )
            else:
                marks_pct = None

            # Check thresholds
            is_weak = (
                (att_pct is not None and att_pct < ATTENDANCE_THRESHOLD)
                or (marks_pct is not None and marks_pct < MARKS_THRESHOLD)
            )

            if is_weak:
                teacher = subject.teacher
                weak_subjects.append({
                    'subject_id': subject.id,
                    'subject_name': subject.name,
                    'subject_code': subject.code,
                    'teacher_name': (
                        teacher.user.get_full_name()
                        if teacher else 'Unassigned'
                    ),
                    'attendance_pct': round(att_pct, 1) if att_pct is not None else None,
                    'marks_pct': round(marks_pct, 1) if marks_pct is not None else None,
                })

        return weak_subjects

    @staticmethod
    def get_admin_analytics(college):
        """
        Build batch → department → at-risk student hierarchy
        with weak subject details for the admin analytics dashboard.
        """
        # Get latest prediction per student using DISTINCT ON (Postgres)
        try:
            latest_preds = (
                Prediction.objects.filter(
                    student__user__college=college,
                    risk_level__in=[RiskLevel.HIGH, RiskLevel.MEDIUM]
                )
                .order_by('student', '-prediction_date', '-id')
                .distinct('student')
                .select_related(
                    'student__user', 'student__batch', 'student__department'
                )
            )
            at_risk = list(latest_preds)
        except Exception:
            # Fallback for SQLite: fetch all, deduplicate in Python
            all_preds = (
                Prediction.objects.filter(
                    student__user__college=college,
                    risk_level__in=[RiskLevel.HIGH, RiskLevel.MEDIUM]
                )
                .order_by('-prediction_date', '-id')
                .select_related(
                    'student__user', 'student__batch', 'student__department'
                )
            )
            seen = set()
            at_risk = []
            for p in all_preds:
                if p.student_id not in seen:
                    seen.add(p.student_id)
                    at_risk.append(p)

        # Build summary
        high_count = sum(1 for p in at_risk if p.risk_level == RiskLevel.HIGH)
        medium_count = sum(
            1 for p in at_risk if p.risk_level == RiskLevel.MEDIUM
        )

        # Group by batch → department
        batch_map = {}
        for pred in at_risk:
            student = pred.student
            batch = student.batch
            dept = student.department

            batch_id = batch.id if batch else 0
            dept_id = dept.id if dept else 0

            if batch_id not in batch_map:
                batch_map[batch_id] = {
                    'id': batch_id,
                    'name': batch.name if batch else 'No Batch',
                    'departments': {},
                }

            dept_map = batch_map[batch_id]['departments']
            if dept_id not in dept_map:
                dept_map[dept_id] = {
                    'id': dept_id,
                    'name': dept.name if dept else 'No Department',
                    'code': dept.code if dept else '—',
                    'students': [],
                }

            weak_subjects = AnalyticsService._get_weak_subjects_for_student(
                student
            )

            dept_map[dept_id]['students'].append({
                'id': student.id,
                'name': student.user.get_full_name(),
                'reg_number': student.user.registration_number,
                'risk_level': pred.risk_level,
                'risk_score': float(pred.risk_score),
                'predicted_gpa': float(pred.predicted_gpa) if pred.predicted_gpa else None,
                'weak_subjects': weak_subjects,
            })

        # Convert maps to lists and compute counts
        batches = []
        for b_data in batch_map.values():
            dept_list = []
            for d_data in b_data['departments'].values():
                d_data['high_count'] = sum(
                    1 for s in d_data['students']
                    if s['risk_level'] == RiskLevel.HIGH
                )
                d_data['medium_count'] = sum(
                    1 for s in d_data['students']
                    if s['risk_level'] == RiskLevel.MEDIUM
                )
                dept_list.append(d_data)
            b_data['departments'] = dept_list
            b_data['high_count'] = sum(d['high_count'] for d in dept_list)
            b_data['medium_count'] = sum(d['medium_count'] for d in dept_list)
            batches.append(b_data)

        return {
            'summary': {
                'total_at_risk': len(at_risk),
                'high': high_count,
                'medium': medium_count,
            },
            'batches': batches,
        }
