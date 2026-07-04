from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import IsTeacher, IsAdmin, IsSameCollege
from .models import ClassSession, Attendance
from .serializers import ClassSessionSerializer, AttendanceSerializer, BulkAttendanceUpdateSerializer
from .services import AttendanceService
from apps.academics.models import Subject
from django.core.exceptions import ValidationError

class ClassSessionViewSet(viewsets.ModelViewSet):
    """
    Manage Class Sessions.
    """
    serializer_class = ClassSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'HEAD']:
            return ClassSession.objects.filter(subject__college=user.college)
        elif user.role == 'TEACHER':
            return ClassSession.objects.filter(subject__teacher__user=user, subject__college=user.college)
        elif user.role == 'STUDENT':
            # Students can see sessions for subjects they are enrolled in
            return ClassSession.objects.filter(subject__enrollments__student__user=user, subject__college=user.college).distinct()
        return ClassSession.objects.none()

    def perform_create(self, serializer):
        # We override create to use Service for atomic operations if we want custom logic
        # But for simple session creation, standard save is okay IF we didn't have to auto-create attendance.
        # Since we MUST auto-create attendance, we should use the View's create method to call service.
        pass

    def create(self, request, *args, **kwargs):
        subject_id = request.data.get('subject')
        date = request.data.get('date')
        topic = request.data.get('topic', '')

        if not subject_id or not date:
            return Response({"detail": "Subject and Date required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subject = Subject.objects.get(id=subject_id)
            if subject.college != request.user.college:
                return Response({"detail": "Invalid Subject"}, status=status.HTTP_403_FORBIDDEN)
            
            # Permission check: Only teacher of subject or admin
            if request.user.role == 'TEACHER':
                if not subject.teacher or subject.teacher.user != request.user:
                    return Response(
                        {"detail": "You are not the teacher of this subject"},
                        status=status.HTTP_403_FORBIDDEN
                    )

            session = AttendanceService.create_class_session(subject, date, request.user, topic)
            return Response(ClassSessionSerializer(session).data, status=status.HTTP_201_CREATED)

        except Subject.DoesNotExist:
            return Response({"detail": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
             return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for attendance records. 
    Updates are handled via bulk endpoints or custom actions on Session.
    """
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = Attendance.objects.select_related(
            'class_session__subject', 'student__user'
        )
        if user.role in ['ADMIN', 'HEAD']:
            return base_qs.filter(class_session__subject__college=user.college)
        elif user.role == 'TEACHER':
            return base_qs.filter(class_session__subject__teacher__user=user, class_session__subject__college=user.college)
        elif user.role == 'STUDENT':
            return base_qs.filter(student__user=user, class_session__subject__college=user.college)
        return Attendance.objects.none()

    @action(detail=False, methods=['post'], url_path='update-bulk', permission_classes=[IsTeacher | IsAdmin])
    def update_bulk(self, request):
        """
        Bulk update attendance for a specific session.
        Expects: { "session_id": 1, "attendance": [{ "student_id": 1, "status": "PRESENT" }] }
        """
        session_id = request.data.get('session_id')
        attendance_data = request.data.get('attendance')

        if not session_id or not attendance_data:
            return Response({"detail": "Session ID and attendance data required"}, status=status.HTTP_400_BAD_REQUEST)

        # Verify permissions for session
        try:
            session = ClassSession.objects.get(id=session_id)
            if request.user.role == 'TEACHER':
                if not session.subject.teacher or session.subject.teacher.user != request.user:
                    return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            if session.subject.college != request.user.college:
                return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
            AttendanceService.update_attendance(session_id, attendance_data)
            return Response({"detail": "Attendance updated successfully"}, status=status.HTTP_200_OK)

        except ClassSession.DoesNotExist:
            return Response({"detail": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
