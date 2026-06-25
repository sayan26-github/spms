from rest_framework import viewsets, permissions, status
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

class JobPostingViewSet(MultiTenantViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer

    @action(detail=False, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def recommended(self, request):
        """AI Recommendation endpoint for students."""
        user = request.user
        if user.role != 'STUDENT':
            return Response({"error": "Only students can get recommendations"}, status=403)
            
        student = Student.objects.get(user=user)
        active_jobs = self.get_queryset().filter(is_active=True)
        
        # Extract student features here to pass to ML Engine
        features_dict = AnalyticsService.extract_features_for_student(student)
        num_skills = student.skills.count()
        skill_score = num_skills * 10
        from apps.analytics.ml_engine import FEATURE_NAMES
        student_features_list = [features_dict[k] for k in FEATURE_NAMES]
        student_features_list.append(skill_score)
        
        # Use ML Engine
        recommendations = get_job_recommendations(student, active_jobs, student_features_list)
        
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
        if self.request.user.role == 'STUDENT':
            return qs.filter(student__user=self.request.user)
        return qs

    def perform_create(self, serializer):
        student = Student.objects.get(user=self.request.user)
        serializer.save(college=self.request.user.college, student=student)

class JobApplicationViewSet(MultiTenantViewSet):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == 'STUDENT':
            return qs.filter(student__user=self.request.user)
        return qs

    def perform_create(self, serializer):
        student = Student.objects.get(user=self.request.user)
        serializer.save(college=self.request.user.college, student=student)


class PlacementAnalyticsView(viewsets.ViewSet):
    """View to get ML Placement Probability"""
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['GET'])
    def my_probability(self, request):
        if request.user.role != 'STUDENT':
            return Response({"error": "Not a student"}, status=403)
            
        student = Student.objects.get(user=request.user)
        features_dict = AnalyticsService.extract_features_for_student(student)
        
        # Append some skill metrics to features
        num_skills = student.skills.count()
        skill_score = num_skills * 10
        
        from apps.analytics.ml_engine import FEATURE_NAMES
        student_features_list = [features_dict[k] for k in FEATURE_NAMES]
        student_features_list.append(skill_score)
        
        active_jobs = JobPosting.objects.filter(college=request.user.college, is_active=True)
        recs = get_job_recommendations(student, active_jobs, student_features_list)
        
        if recs:
            top_recs = recs[:3]
            avg_prob = sum(r['placement_probability'] for r in top_recs) / len(top_recs)
        else:
            avg_prob = 0.5
        
        return Response({
            "placement_probability": round(avg_prob, 4),
            "skills_count": num_skills,
            "message": "AI Analysis complete"
        })

    @action(detail=False, methods=['POST'], permission_classes=[IsAdmin])
    def train_model(self, request):
        """Train the XGBoost placement model using historical data."""
        college = request.user.college
        applications = JobApplication.objects.filter(college=college).select_related('student', 'job')
        
        X = []
        y = []
        
        from apps.analytics.ml_engine import FEATURE_NAMES
        
        for app in applications:
            try:
                features_dict = AnalyticsService.extract_features_for_student(app.student)
                num_skills = app.student.skills.count()
                skill_score = num_skills * 10
                
                student_features_list = [features_dict[k] for k in FEATURE_NAMES]
                student_features_list.append(skill_score)
                
                job_skills_count = app.job.required_skills.count()
                ctc_val = float(app.job.ctc) if app.job.ctc else 0.0
                job_features = [float(app.job.min_gpa), ctc_val, job_skills_count]
                
                X.append(student_features_list + job_features)
                y.append(1 if app.status == 'OFFERED' else 0)
            except Exception:
                continue
                
        if not X:
            return Response({"error": "No historical data available to train."}, status=400)
            
        predictor = PlacementPredictor()
        success = predictor.train(X, y)
        
        if success:
            return Response({"message": f"Model successfully trained on {len(X)} records."})
        else:
            return Response({"error": "Training failed. Minimum 5 records required."}, status=400)
