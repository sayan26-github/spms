from rest_framework import serializers
from .models import Prediction

class PredictionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    registration_number = serializers.CharField(source='student.user.registration_number', read_only=True)

    class Meta:
        model = Prediction
        fields = ['id', 'student', 'student_name', 'registration_number', 'predicted_gpa', 'risk_level', 'risk_score', 'prediction_date']
