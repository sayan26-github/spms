from apps.analytics.services import AnalyticsService
from apps.analytics.ml_engine import get_job_recommendations, FEATURE_NAMES, PlacementPredictor
from apps.placements.models import JobPosting, JobApplication

class PlacementService:
    @staticmethod
    def get_job_recommendations_for_student(student, active_jobs=None):
        if active_jobs is None:
            active_jobs = JobPosting.objects.filter(college=student.user.college, is_active=True)
            
        features_dict = AnalyticsService.extract_features_for_student(student)
        num_skills = student.skills.count()
        skill_score = num_skills * 10
        
        student_features_list = [features_dict.get(k, 0) for k in FEATURE_NAMES]
        student_features_list.append(skill_score)
        
        return get_job_recommendations(student, active_jobs, student_features_list)

    @staticmethod
    def train_placement_model(college):
        applications = JobApplication.objects.filter(college=college).select_related('student', 'job')
        
        X = []
        y = []
        
        for app in applications:
            try:
                features_dict = AnalyticsService.extract_features_for_student(app.student)
                num_skills = app.student.skills.count()
                skill_score = num_skills * 10
                
                student_features_list = [features_dict.get(k, 0) for k in FEATURE_NAMES]
                student_features_list.append(skill_score)
                
                job_skills_count = app.job.required_skills.count()
                ctc_val = float(app.job.ctc) if app.job.ctc else 0.0
                job_features = [float(app.job.min_gpa), ctc_val, job_skills_count]
                
                X.append(student_features_list + job_features)
                y.append(1 if app.status == 'OFFERED' else 0)
            except Exception:
                continue
                
        if not X:
            return False, "No historical data available to train."
            
        predictor = PlacementPredictor()
        success = predictor.train(X, y)
        
        if success:
            return True, f"Model successfully trained on {len(X)} records."
        return False, "Training failed. Minimum 5 records required."
