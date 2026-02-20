import numpy as np
# import pandas as pd # Uncomment when needed
from sklearn.linear_model import LinearRegression

class PerformancePredictor:
    """
    Encapsulates ML logic for student performance prediction.
    Currently a stub/MVP implementation.
    """
    def __init__(self):
        self.model = LinearRegression()
        self.is_trained = False

    def train(self, X, y):
        """
        Train the model with historical data.
        X: Features (Attendance %, Past Grades, etc.)
        y: Target (Final GPA)
        """
        # MVP: simple mock training
        # self.model.fit(X, y)
        self.is_trained = True
        pass

    def predict(self, features):
        """
        Predict performance based on features.
        features: list or array of feature values
        """
        if not self.is_trained:
            # Fallback or load pre-trained model
            pass
        
        # MVP: Mock prediction logic
        # Assume features = [attendance_percentage, avg_internal_marks]
        attendance = features[0]
        avg_marks = features[1]
        
        # Simple heuristic for MVP
        predicted_gpa = (attendance * 0.05) + (avg_marks * 0.05) 
        # Normalize to 10 scale
        predicted_gpa = min(10.0, max(0.0, predicted_gpa))
        
        return predicted_gpa

    def calculate_risk(self, predicted_gpa):
        """
        Determine risk level based on predicted GPA.
        """
        if predicted_gpa < 4.0:
            return 'HIGH', 0.9
        elif predicted_gpa < 6.0:
            return 'MEDIUM', 0.5
        else:
            return 'LOW', 0.1
