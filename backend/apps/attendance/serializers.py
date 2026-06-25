from rest_framework import serializers
from .models import ClassSession, Attendance
from apps.academics.serializers import SubjectSerializer

class ClassSessionSerializer(serializers.ModelSerializer):
    subject_details = SubjectSerializer(source='subject', read_only=True)
    attendance_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassSession
        fields = ['id', 'subject', 'subject_details', 'date', 'topic', 'created_by', 'attendance_count']
        read_only_fields = ['created_by']

    def get_attendance_count(self, obj):
        return obj.attendances.count()

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    registration_number = serializers.CharField(source='student.user.registration_number', read_only=True)
    class_session_details = ClassSessionSerializer(source='class_session', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'class_session', 'class_session_details', 'student', 'student_name', 'registration_number', 'status', 'remarks']
        read_only_fields = ['class_session']

class BulkAttendanceUpdateSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    status = serializers.CharField()
