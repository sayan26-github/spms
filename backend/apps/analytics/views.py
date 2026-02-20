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
