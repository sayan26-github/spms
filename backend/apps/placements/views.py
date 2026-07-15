from rest_framework import viewsets, permissions, status
from apps.common.constants import UserRole

from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import IsSameCollege, IsAdmin, IsStudent
from .models import Company, JobPosting, Skill, JobSkill, StudentSkill, JobApplication
from .serializers import (
    CompanySerializer, JobPostingSerializer, SkillSerializer,
    StudentSkillSerializer, JobApplicationSerializer
)
from apps.academics.models import Student
from apps.analytics.ml_engine import PlacementPredictor, get_job_recommendations
from apps.analytics.services import AnalyticsService

class MultiTenantViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        # Strict isolation: Only objects from user's college
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
            
        if hasattr(self.queryset.model, 'college'):
            return self.queryset.filter(college=user.college)
        elif hasattr(self.queryset.model, 'user'):
            return self.queryset.filter(user__college=user.college)
        return self.queryset.none()

    def perform_create(self, serializer):
        serializer.save(college=self.request.user.college)

class CompanyViewSet(MultiTenantViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

class SkillViewSet(MultiTenantViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    pagination_class = None

class JobPostingViewSet(MultiTenantViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer

    @action(detail=False, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def recommended(self, request):
        """AI Recommendation endpoint for students."""
        user = request.user
        if user.role != 'STUDENT':
            return Response({"error": "Only students can get recommendations"}, status=403)
            
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=404)
            
        active_jobs = self.get_queryset().filter(is_active=True)
        
        from .services import PlacementService
        recommendations = PlacementService.get_job_recommendations_for_student(student, active_jobs)
        
        # Serialize jobs within recommendations
        serialized_recs = []
        for rec in recommendations:
            job_data = JobPostingSerializer(rec['job']).data
            serialized_recs.append({
                'job': job_data,
                'match_score': rec['match_score'],
                'placement_probability': rec['placement_probability'],
                'missing_skills': rec['missing_skills']
            })
            
        return Response(serialized_recs)

class StudentSkillViewSet(MultiTenantViewSet):
    queryset = StudentSkill.objects.all()
    serializer_class = StudentSkillSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == UserRole.STUDENT:
            return qs.filter(student__user=self.request.user)
        return qs

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        try:
            student = Student.objects.get(user=self.request.user)
        except Student.DoesNotExist:
            raise ValidationError("Student profile not found.")
        serializer.save(college=self.request.user.college, student=student)

class JobApplicationViewSet(MultiTenantViewSet):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == UserRole.STUDENT:
            return qs.filter(student__user=self.request.user)
        return qs

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        try:
            student = Student.objects.get(user=self.request.user)
        except Student.DoesNotExist:
            raise ValidationError("Student profile not found.")
            
        job = serializer.validated_data.get('job')
        if job and job.college != self.request.user.college:
            raise ValidationError("You can only apply to jobs within your college.")
        serializer.save(college=self.request.user.college, student=student)


class PlacementAnalyticsView(viewsets.ViewSet):
    """View to get ML Placement Probability"""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """Return available analytics endpoints."""
        return Response({
            'endpoints': {
                'my_probability': '/placements/analytics/my_probability/',
                'train_model': '/placements/analytics/train_model/',
            }
        })

    @action(detail=False, methods=['GET'])
    def my_probability(self, request):
        if request.user.role != 'STUDENT':
            return Response({"error": "Not a student"}, status=403)
            
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=404)
            
        from .services import PlacementService
        active_jobs = JobPosting.objects.filter(college=request.user.college, is_active=True)
        recs = PlacementService.get_job_recommendations_for_student(student, active_jobs)
        
        if recs:
            top_recs = recs[:3]
            avg_prob = sum(r['placement_probability'] for r in top_recs) / len(top_recs)
        else:
            avg_prob = 0.5
            
        num_skills = StudentSkill.objects.filter(student=student).count()
        
        return Response({
            "placement_probability": round(avg_prob, 4),
            "skills_count": num_skills,
            "message": "AI Analysis complete"
        })

    @action(detail=False, methods=['POST'], permission_classes=[IsAdmin])
    def train_model(self, request):
        """Train the XGBoost placement model using historical data."""
        college = request.user.college
        from .services import PlacementService
        success, message = PlacementService.train_placement_model(college)
        
        if success:
            return Response({"message": message})
        else:
            return Response({"error": message}, status=400)
