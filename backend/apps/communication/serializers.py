from rest_framework import serializers
from apps.common.constants import UserRole

from .models import Message, Notification, Feedback
from apps.users.serializers import UserSerializer
from apps.users.models import User
from apps.academics.models import Subject

class MessageSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    receiver = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(), write_only=True
    )
    receiver_details = UserSerializer(source='receiver', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_details',
            'receiver', 'receiver_details',
            'subject', 'body', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'created_at', 'is_read']

    def get_fields(self):
        """Scope the receiver queryset to the requesting user's college."""
        fields = super().get_fields()
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            fields['receiver'].queryset = User.objects.filter(
                college=request.user.college
            )
        return fields

    def validate_receiver(self, value):
        user = self.context['request'].user
        if value.college != user.college:
            raise serializers.ValidationError(
                "You can only message users within your college."
            )
        return value

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'title', 'message',
            'notification_type', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class FeedbackSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Feedback
        fields = [
            'id', 'student', 'student_name', 'subject',
            'subject_name', 'rating', 'comments',
            'is_anonymous', 'created_at'
        ]
        read_only_fields = ['id', 'student', 'created_at']

    def get_student_name(self, obj):
        if obj.is_anonymous:
            return "Anonymous"
        return obj.student.get_full_name()

    def validate_subject(self, value):
        user = self.context['request'].user
        if user.role == UserRole.STUDENT:
            from apps.academics.models import Student
            student = Student.objects.filter(user=user).first()
            if not student or not value.enrollments.filter(student=student, is_active=True).exists():
                raise serializers.ValidationError("You can only leave feedback for subjects you are enrolled in.")
        return value

