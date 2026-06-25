"""
XGBoost-based Student Performance Prediction Engine.

All ML logic is encapsulated here per architecture rules.
No ML logic in views or serializers.
"""
import os
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Feature names in sorted order (must match extract_features_for_student keys)
FEATURE_NAMES = sorted([
    'overall_attendance_pct', 'current_sem_attendance_pct',
    'attendance_trend', 'total_absent_count',
    'avg_marks_pct', 'current_sem_avg_marks', 'marks_trend',
    'internal_avg', 'quiz_avg',
    'lowest_subject_pct', 'subjects_below_40', 'subjects_below_60',
    'semester', 'num_enrolled_subjects',
    'late_count', 'marks_std_dev',
    'assignment_completion_pct', 'assignment_avg_marks_pct',
    'skill_count', 'avg_skill_proficiency', 'job_applications_count',
])

# Path where trained model is persisted
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'trained_models')
MODEL_PATH = os.path.join(MODEL_DIR, 'xgb_model.joblib')


class PerformancePredictor:
    """
    XGBoost-based predictor for student performance.
    Supports training, saving, loading, and prediction.
    """

    def __init__(self):
        self.model = None
        self.is_trained = False
        self._try_load_model()

    def _try_load_model(self):
        """Attempt to load a previously trained model from disk."""
        try:
            import joblib
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                self.is_trained = True
                logger.info("Loaded trained XGBoost model from disk.")
        except Exception as e:
            logger.warning(f"Could not load model: {e}")
            self.is_trained = False

    def train(self, X, y):
        """
        Train the XGBoost model with real data.
        X: list of feature vectors (each vector has 16 values)
        y: list of actual GPA values (target)
        """
        try:
            from xgboost import XGBRegressor
        except ImportError:
            logger.error("xgboost not installed. Using fallback.")
            self.is_trained = False
            return False

        X_arr = np.array(X, dtype=np.float32)
        y_arr = np.array(y, dtype=np.float32)

        if len(X_arr) < 5:
            logger.warning(
                f"Only {len(X_arr)} samples. Need at least 5 for training."
            )
            self.is_trained = False
            return False

        self.model = XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            objective='reg:squarederror',
            random_state=42,
            verbosity=0,
        )
        self.model.fit(X_arr, y_arr)
        self.is_trained = True

        # Save to disk
        self._save_model()
        logger.info(
            f"XGBoost model trained on {len(X_arr)} samples and saved."
        )
        return True

    def _save_model(self):
        """Persist the trained model to disk."""
        import joblib
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)

    def predict(self, features):
        """
        Predict GPA for a single student.
        features: list or dict of feature values.
        Returns predicted GPA (0-10 scale).
        """
        if isinstance(features, dict):
            feature_values = [features[k] for k in FEATURE_NAMES]
        else:
            feature_values = features

        if self.is_trained and self.model is not None:
            X = np.array([feature_values], dtype=np.float32)
            predicted = float(self.model.predict(X)[0])
            return min(10.0, max(0.0, round(predicted, 2)))

        # Fallback heuristic if model not trained
        return self._fallback_predict(feature_values)

    def _fallback_predict(self, feature_values):
        """
        Rule-based fallback when XGBoost model is not yet trained.
        Uses weighted combination of attendance and marks.
        """
        features_dict = dict(zip(FEATURE_NAMES, feature_values))
        att = features_dict.get('overall_attendance_pct', 0)
        marks = features_dict.get('avg_marks_pct', 0)
        predicted = (att * 0.03) + (marks * 0.07)
        return min(10.0, max(0.0, round(predicted, 2)))

    def calculate_risk(self, predicted_gpa):
        """
        Determine risk level based on predicted GPA.
        Returns (risk_level, risk_score).
        """
        if predicted_gpa < 4.0:
            return 'HIGH', round(0.85 + (4.0 - predicted_gpa) * 0.0375, 4)
        elif predicted_gpa < 6.0:
            return 'MEDIUM', round(0.3 + (6.0 - predicted_gpa) * 0.125, 4)
        else:
            return 'LOW', round(max(0.01, 0.3 - (predicted_gpa - 6.0) * 0.07), 4)

    def get_feature_importance(self):
        """
        Return feature importance scores from the trained model.
        """
        if not self.is_trained or self.model is None:
            return {}
        importances = self.model.feature_importances_
        return dict(zip(FEATURE_NAMES, [round(float(v), 4) for v in importances]))


class PlacementPredictor:
    """
    Logistic Regression / XGBoost based predictor for student placement.
    """
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.model_path = os.path.join(MODEL_DIR, 'placement_model.joblib')
        self._try_load_model()

    def _try_load_model(self):
        try:
            import joblib
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                self.is_trained = True
                logger.info("Loaded trained Placement model from disk.")
        except Exception as e:
            logger.warning(f"Could not load placement model: {e}")
            self.is_trained = False

    def train(self, X, y):
        try:
            from xgboost import XGBClassifier
        except ImportError:
            return False

        X_arr = np.array(X, dtype=np.float32)
        y_arr = np.array(y, dtype=np.float32)

        if len(X_arr) < 5:
            return False

        self.model = XGBClassifier(
            n_estimators=100,
            max_depth=3,
            learning_rate=0.1,
            objective='binary:logistic',
            random_state=42,
            verbosity=0,
        )
        try:
            self.model.fit(X_arr, y_arr)
            self.is_trained = True
            
            import joblib
            os.makedirs(MODEL_DIR, exist_ok=True)
            joblib.dump(self.model, self.model_path)
            return True
        except Exception as e:
            logger.error(f"XGBoost training failed: {e}")
            self.is_trained = False
            return False

    def predict_probability(self, features):
        if self.is_trained and self.model is not None:
            X = np.array([features], dtype=np.float32)
            prob = float(self.model.predict_proba(X)[0][1])
            return round(prob, 4)
        
        # Fallback if not trained (will be overridden by caller heuristics if needed)
        return 0.5


def get_job_recommendations(student, jobs, student_features_list=None):
    """
    Content-based filtering using skills + XGBoost Placement Probability.
    """
    student_skills = set(student.skills.values_list('skill__name', flat=True))
    predictor = PlacementPredictor()
    
    recommendations = []
    for job in jobs:
        job_skills = set(job.required_skills.values_list('skill__name', flat=True))
        if not job_skills:
            match_score = 50.0
        else:
            intersection = student_skills.intersection(job_skills)
            match_score = (len(intersection) / len(job_skills)) * 100.0
            
        # Factor in GPA
        gpa_penalty = 0
        predicted_gpa = student.predictions.order_by('-created_at').first()
        if predicted_gpa and predicted_gpa.predicted_gpa < job.min_gpa:
            gpa_penalty = 20
            
        final_score = max(0, min(100, match_score - gpa_penalty))
        missing = job_skills - student_skills
        
        prob = 0.5
        if student_features_list is not None:
            ctc_val = float(job.ctc) if job.ctc else 0.0
            job_features = [float(job.min_gpa), ctc_val, len(job_skills)]
            combined_features = student_features_list + job_features
            
            if predictor.is_trained:
                prob = predictor.predict_probability(combined_features)
            else:
                base_prob = match_score / 100.0
                if predicted_gpa and predicted_gpa.predicted_gpa >= job.min_gpa:
                    base_prob = min(0.95, base_prob + 0.15)
                else:
                    base_prob = max(0.05, base_prob - 0.20)
                prob = round(base_prob, 4)
        
        recommendations.append({
            'job': job,
            'match_score': round(final_score, 1),
            'placement_probability': prob,
            'missing_skills': list(missing)
        })
        
    recommendations.sort(key=lambda x: (x['placement_probability'], x['match_score']), reverse=True)
    return recommendations

