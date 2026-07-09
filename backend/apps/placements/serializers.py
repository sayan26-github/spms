from rest_framework import serializers
from .models import Company, JobPosting, Skill, JobSkill, StudentSkill, JobApplication
from apps.academics.serializers import StudentProfileSerializer

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'description', 'tier', 'website', 'created_at']


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']


class JobSkillSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)
    
    class Meta:
        model = JobSkill
        fields = ['id', 'skill']


class JobPostingSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), source='company', write_only=True
    )
    required_skills = JobSkillSerializer(many=True, read_only=True)
    
    class Meta:
        model = JobPosting
        fields = ['id', 'company', 'company_id', 'title', 'description', 'job_type', 
                  'min_gpa', 'ctc', 'is_active', 'deadline', 'created_at', 'required_skills']


class StudentSkillSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)
    skill_id = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), source='skill', write_only=True
    )
    
    class Meta:
        model = StudentSkill
        fields = ['id', 'skill', 'skill_id', 'proficiency']


class JobApplicationSerializer(serializers.ModelSerializer):
    job = JobPostingSerializer(read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(
        queryset=JobPosting.objects.all(), source='job', write_only=True
    )
    student = StudentProfileSerializer(read_only=True)
    
    class Meta:
        model = JobApplication
        fields = ['id', 'job', 'job_id', 'student', 'resume', 'status', 'created_at', 'updated_at']
