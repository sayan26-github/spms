from rest_framework import serializers
from .models import Assessment, Marks
from apps.academics.serializers import SubjectSerializer

class AssessmentSerializer(serializers.ModelSerializer):
    subject_details = SubjectSerializer(source='subject', read_only=True)

    class Meta:
        model = Assessment
        fields = ['id', 'subject', 'subject_details', 'name', 'assessment_type', 'max_marks', 'weightage', 'date', 'created_by']
        read_only_fields = ['created_by']

class MarksSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    registration_number = serializers.CharField(source='student.user.registration_number', read_only=True)
    assessment_details = AssessmentSerializer(source='assessment', read_only=True)

    class Meta:
        model = Marks
        fields = ['id', 'assessment', 'assessment_details', 'student', 'student_name', 'registration_number', 'marks_obtained', 'remarks']
        read_only_fields = ['assessment']

class BulkMarksSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    marks = serializers.DecimalField(max_digits=5, decimal_places=2)

from .models import AssignmentTask, AssignmentSubmission

class AssignmentTaskSerializer(serializers.ModelSerializer):
    subject_details = SubjectSerializer(source='subject', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = AssignmentTask
        fields = [
            'id', 'subject', 'subject_details', 'title', 'description', 
            'file', 'due_date', 'max_marks', 'created_by', 'created_by_name', 
            'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    registration_number = serializers.CharField(source='student.user.registration_number', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'assignment_title', 'student', 'student_name', 
            'registration_number', 'file', 'marks_obtained', 'remarks', 'created_at'
        ]
        read_only_fields = ['student', 'created_at']
