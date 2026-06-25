from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import IsAdmin, IsHead, IsTeacher
from .models import Prediction
from .serializers import PredictionSerializer
from .services import AnalyticsService

class PredictionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View predictions.
    Heads/Admins see all for college.
    Teachers see for their students (Todo: logic for 'their students' in analytics context is tricky, usually class teacher).
    Students see their own.
    """
    serializer_class = PredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'HEAD']:
            return Prediction.objects.filter(student__user__college=user.college)
        elif user.role == 'TEACHER':
            # Teachers can see predictions for students in their college? Or strictly their subjects?
            # Analytics is high level. Let's allow Teachers to see analytics for their college students for now
            # as they need to identify at-risk students.
            return Prediction.objects.filter(student__user__college=user.college)
        elif user.role == 'STUDENT':
            return Prediction.objects.filter(student__user=user)
        return Prediction.objects.none()

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin | IsHead])
    def run_analysis(self, request):
        """
        Trigger batch analysis for the college.
        """
        count = AnalyticsService.run_batch_predictions(request.user.college)
        return Response({"detail": f"Analysis completed for {count} students."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsTeacher | IsHead | IsAdmin])
    def dashboard_stats(self, request):
        """
        Get aggregated stats for the dashboard.
        """
        from apps.common.constants import RiskLevel
        
        user = request.user
        qs = Prediction.objects.filter(student__user__college=user.college)
        
        # Optimized for Postgres: distinct on student to get latest
        try:
            latest_qs = qs.order_by('student', '-prediction_date', '-id').distinct('student')
            
            # Count in Python to avoid complex SQL grouping with DISTINCT ON
            # efficient enough for typical college sizes
            latest_risks = list(latest_qs.values_list('risk_level', flat=True))
            
            from collections import Counter
            counts = Counter(latest_risks)
            
            data = {
                'high': counts.get(RiskLevel.HIGH, 0),
                'medium': counts.get(RiskLevel.MEDIUM, 0),
                'low': counts.get(RiskLevel.LOW, 0),
                'total': len(latest_risks)
            }
        except Exception:
            # Fallback for SQLite/others
            from django.utils import timezone
            today = timezone.now().date()
            today_qs = qs.filter(prediction_date=today)
            data = {
                'high': today_qs.filter(risk_level=RiskLevel.HIGH).count(),
                'medium': today_qs.filter(risk_level=RiskLevel.MEDIUM).count(),
                'low': today_qs.filter(risk_level=RiskLevel.LOW).count(),
                'total': today_qs.count()
            }
        
        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin | IsHead])
    def admin_overview(self, request):
        """
        Aggregated at-risk student data grouped by batch and department.
        Includes weak subjects with attendance %, marks %, and teacher info.
        """
        data = AnalyticsService.get_admin_analytics(request.user.college)
        return Response(data)

    @action(detail=False, methods=['get'], url_path='teacher-analytics', permission_classes=[IsTeacher])
    def teacher_analytics(self, request):
        """
        Returns XAI insights and at-risk students specific to this teacher.
        """
        try:
            from apps.academics.models import Teacher
            teacher = Teacher.objects.get(user=request.user)
            data = AnalyticsService.get_teacher_analytics(teacher)
            return Response(data)
        except Teacher.DoesNotExist:
            return Response(
                {"detail": "Teacher profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], url_path='my-insights')
    def my_insights(self, request):
        """
        Returns the student's latest prediction with recommendations,
        feature breakdown, and subject-level performance.
        """
        user = request.user
        if user.role != 'STUDENT':
            return Response(
                {"detail": "Only students can access insights."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            from apps.academics.models import Student
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return Response(
                {"detail": "Student profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get or generate latest prediction
        prediction = Prediction.objects.filter(student=student).order_by('-prediction_date', '-id').first()

        if not prediction:
            # Generate on-the-fly if none exists
            prediction = AnalyticsService.generate_prediction_for_student(student)

        # Build subject-level performance data
        weak_subjects = AnalyticsService._get_weak_subjects_for_student(student)

        # Semester progression (GPA per semester from features)
        from apps.assessments.services import get_grade_and_points, AssessmentService
        from apps.assessments.models import Marks
        marks_qs = Marks.objects.filter(student=student).select_related(
            'assessment', 'assessment__subject'
        )
        semester_gpas = {}
        for m in marks_qs:
            sem = m.assessment.subject.semester
            if sem not in semester_gpas:
                semester_gpas[sem] = {}
            subj_id = m.assessment.subject.id
            if subj_id not in semester_gpas[sem]:
                semester_gpas[sem][subj_id] = {'obtained': 0.0, 'max': 0.0}
            semester_gpas[sem][subj_id]['obtained'] += float(m.marks_obtained)
            semester_gpas[sem][subj_id]['max'] += float(m.assessment.max_marks)

        progression = []
        for sem in sorted(semester_gpas.keys()):
            total_points = 0
            count = 0
            for data in semester_gpas[sem].values():
                pct = (data['obtained'] / data['max'] * 100) if data['max'] > 0 else 0
                _, points = get_grade_and_points(pct)
                total_points += points
                count += 1
            sgpa = round(total_points / count, 2) if count > 0 else 0
            progression.append({'semester': sem, 'sgpa': sgpa})

        return Response({
            'prediction': {
                'predicted_gpa': float(prediction.predicted_gpa) if prediction.predicted_gpa else 0,
                'risk_level': prediction.risk_level,
                'risk_score': float(prediction.risk_score),
                'model_version': prediction.model_version,
                'prediction_date': str(prediction.prediction_date),
            },
            'recommendations': prediction.recommendations or [],
            'features': prediction.features_snapshot or {},
            'weak_subjects': weak_subjects,
            'semester_progression': progression,
        })

    @action(detail=False, methods=['get'], url_path='subject-recommendations')
    def subject_recommendations(self, request):
        """
        Returns the top 3 recommended electives for the student.
        """
        user = request.user
        if user.role != 'STUDENT':
            return Response(
                {"detail": "Only students can access recommendations."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            from apps.academics.models import Student
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return Response(
                {"detail": "Student profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        recs = AnalyticsService.get_subject_recommendations(student)
        return Response(recs)

