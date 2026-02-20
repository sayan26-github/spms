from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from .models import User
from apps.academics.models import College

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model (Read Only for most parts).
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    college_name = serializers.CharField(source='college.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'registration_number', 'first_name', 'last_name', 
            'email', 'role', 'role_display', 'college', 'college_name',
            'is_active', 'must_change_password', 'last_login'
        ]
        read_only_fields = ['id', 'role', 'college', 'must_change_password', 'last_login']

class LoginSerializer(serializers.Serializer):
    registration_number = serializers.CharField()
    password = serializers.CharField(write_only=True)
    college_code = serializers.CharField(required=False, help_text="Optional if reg number is unique globally, but better to specify.")

    def validate(self, attrs):
        registration_number = attrs.get('registration_number')
        password = attrs.get('password')

        if not registration_number or not password:
            msg = _('Must include "registration_number" and "password".')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = None # Handled in View/Service
        return attrs

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    # Optional fields for student creation
    batch_id = serializers.IntegerField(required=False, write_only=True)
    department_id = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ['registration_number', 'password', 'first_name', 'last_name', 'email', 'role', 'college', 'batch_id', 'department_id']
        read_only_fields = ['college']

    def create(self, validated_data):
        password = validated_data.pop('password')
        batch_id = validated_data.pop('batch_id', None)
        department_id = validated_data.pop('department_id', None)
        
        user = User.objects.create_user(password=password, **validated_data)
        
        # If user is a student, we might need to link batch/dept here if passed
        # OR the Profile is created via signals. 
        # Assuming Profile is created via signals (which it should be), we update it.
        if user.role == 'STUDENT' and (batch_id or department_id):
            # Fetch profile (created by signal)
            try:
                student_profile = user.student_profile
                if batch_id:
                    student_profile.batch_id = batch_id
                if department_id:
                    student_profile.department_id = department_id
                student_profile.save()
            except Exception:
                # Fallback if signal didn't run or profile missing
                pass
                
        return user
