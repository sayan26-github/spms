from rest_framework import serializers
from .models import College, Subject, Student, Teacher, Enrollment, Resource, Batch, Department
from apps.users.serializers import UserSerializer

class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = '__all__'

class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = ['id', 'name', 'year', 'college']
        read_only_fields = ['college']

class DepartmentSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(source='batch.name', read_only=True, default='')

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'college', 'batch', 'batch_name']
        read_only_fields = ['college']

class TeacherProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    class Meta:
        model = Teacher
        fields = ['id', 'user_details', 'department', 'designation']

class StudentProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    batch_details = BatchSerializer(source='batch', read_only=True)
    department_details = DepartmentSerializer(source='department', read_only=True)
    
    class Meta:
        model = Student
        fields = ['id', 'user_details', 'batch', 'batch_details', 'department', 'department_details', 'semester']

class SubjectSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True, default="Unassigned")
    
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'semester', 'college', 'teacher', 'teacher_name']
        read_only_fields = ['college']

class EnrollmentSerializer(serializers.ModelSerializer):
    subject_details = SubjectSerializer(source='subject', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_reg_number = serializers.CharField(source='student.user.registration_number', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'student_name', 'student_reg_number', 'subject', 'subject_details', 'is_active', 'created_at']

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'subject', 'title', 'description', 'file', 'link', 'created_at']
        read_only_fields = ['created_at']
