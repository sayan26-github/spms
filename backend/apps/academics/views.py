from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes as permission_classes_decorator
from rest_framework.response import Response
from apps.users.permissions import IsTeacher, IsAdmin, IsSameCollege, IsHead
from .models import Subject, Enrollment, Student, Teacher, Resource, Batch, Department
from .serializers import (
    SubjectSerializer, EnrollmentSerializer, 
    StudentProfileSerializer, TeacherProfileSerializer, ResourceSerializer,
    BatchSerializer, DepartmentSerializer
)
from apps.users.models import User
from .services import AcademicService
from django.core.exceptions import ValidationError

class BatchViewSet(viewsets.ModelViewSet):
    """
    Manage Batches.
    """
    serializer_class = BatchSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHead]

    def get_queryset(self):
        return Batch.objects.filter(college=self.request.user.college)

    def perform_create(self, serializer):
        serializer.save(college=self.request.user.college)

class DepartmentViewSet(viewsets.ModelViewSet):
    """
    Manage Departments. Supports ?batch=<id> filter.
    """
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHead]

    def get_queryset(self):
        """Filter departments by college and optional batch param."""
        qs = Department.objects.filter(college=self.request.user.college)
        batch_id = self.request.query_params.get('batch')
        if batch_id:
            qs = qs.filter(batch_id=batch_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(college=self.request.user.college)


class StudentViewSet(viewsets.ModelViewSet):
    """
    Manage Students. Supports ?batch=<id>&department=<id> filters.
    """
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHead]

    def get_queryset(self):
        """Filter students by college, batch, and department."""
        qs = Student.objects.select_related(
            'user', 'batch', 'department'
        ).filter(user__college=self.request.user.college)

        batch_id = self.request.query_params.get('batch')
        dept_id = self.request.query_params.get('department')
        if batch_id:
            qs = qs.filter(batch_id=batch_id)
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        return qs

class TeacherProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only list of Teacher profiles for assignment dropdowns."""
    serializer_class = TeacherProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHead]

    def get_queryset(self):
        return Teacher.objects.select_related('user').filter(
            user__college=self.request.user.college
        )


class SubjectViewSet(viewsets.ModelViewSet):
    """
    Manage Subjects.
    Teachers can view their subjects.
    Admins can manage all.
    """
    serializer_class = SubjectSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'assign_teacher']:
            return [permissions.IsAuthenticated(), (IsAdmin | IsHead)()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.role == 'HEAD':
            return Subject.objects.filter(college=user.college)
        elif user.role == 'TEACHER':
            return Subject.objects.filter(teacher__user=user, college=user.college)
        elif user.role == 'STUDENT':
            return Subject.objects.filter(enrollments__student__user=user, college=user.college).distinct()
        return Subject.objects.none()

    def perform_create(self, serializer):
        serializer.save(college=self.request.user.college)

    @action(detail=True, methods=['post'])
    def assign_teacher(self, request, pk=None):
        """Assign a teacher to this subject. Expects {teacher_id}."""
        subject = self.get_object()
        teacher_id = request.data.get('teacher_id')
        if teacher_id is None:
            return Response(
                {"detail": "teacher_id required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            teacher = Teacher.objects.get(
                id=teacher_id, user__college=request.user.college
            )
        except Teacher.DoesNotExist:
            return Response(
                {"detail": "Teacher not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        try:
            subject = AcademicService.assign_teacher_to_subject(teacher, subject)
            return Response(SubjectSerializer(subject).data)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    Manage Enrollments.
    """
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Enrollment.objects.select_related(
            'student__user', 'subject'
        )
        if user.role in ['ADMIN', 'HEAD']:
            return qs.filter(student__user__college=user.college)
        elif user.role == 'TEACHER':
            return qs.filter(subject__teacher__user=user, subject__college=user.college)
        elif user.role == 'STUDENT':
            return qs.filter(student__user=user, student__user__college=user.college)
        return Enrollment.objects.none()

    @action(detail=False, methods=['get'])
    def by_subject(self, request):
        """Get enrollments for a specific subject. ?subject_id=X"""
        subject_id = request.query_params.get('subject_id')
        if not subject_id:
            return Response(
                {"detail": "subject_id query param required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        enrollments = Enrollment.objects.select_related(
            'student__user', 'subject'
        ).filter(
            subject_id=subject_id,
            subject__college=request.user.college,
            is_active=True
        )
        return Response(EnrollmentSerializer(enrollments, many=True).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def bulk_enroll(self, request):
        """
        Bulk enroll/sync students for a subject.
        Expects {subject_id, student_ids: [...]}.
        Creates new enrollments, deactivates removed ones.
        """
        subject_id = request.data.get('subject_id')
        student_ids = request.data.get('student_ids', [])

        if not subject_id:
            return Response(
                {"detail": "subject_id required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            subject = Subject.objects.get(
                id=subject_id, college=request.user.college
            )
        except Subject.DoesNotExist:
            return Response(
                {"detail": "Subject not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        updated = AcademicService.bulk_enroll(subject, student_ids)
        return Response(
            EnrollmentSerializer(updated, many=True).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin | IsTeacher])
    def enroll(self, request):
        """
        Custom endpoint to enroll a single student.
        Expects student_id and subject_id.
        """
        student_id = request.data.get('student_id')
        subject_id = request.data.get('subject_id')

        if not student_id or not subject_id:
            return Response({"detail": "student_id and subject_id required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = Student.objects.get(
                id=student_id, user__college=request.user.college
            )
            subject = Subject.objects.get(
                id=subject_id, college=request.user.college
            )
            
            # Multi-tenant check already enforced by the filtered queries above

            enrollment = AcademicService.enroll_student(student, subject)
            return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)
        except (Student.DoesNotExist, Subject.DoesNotExist):
            return Response({"detail": "Student or Subject not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ResourceViewSet(viewsets.ModelViewSet):
    """
    Manage Study Materials (Resources).
    Teachers can upload/delete for their subjects.
    Students can view/download for enrolled subjects.
    """
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return Resource.objects.filter(subject__teacher__user=user, subject__college=user.college)
        elif user.role == 'STUDENT':
            return Resource.objects.filter(subject__enrollments__student__user=user, subject__enrollments__is_active=True, subject__college=user.college).distinct()
        elif user.role in ['ADMIN', 'HEAD']:
             return Resource.objects.filter(subject__college=user.college)
        return Resource.objects.none()

    def perform_create(self, serializer):
        # Validation: Ensure teacher owns the subject
        subject = serializer.validated_data['subject']
        user = self.request.user
        
        if user.role == 'TEACHER':
            if not subject.teacher or subject.teacher.user != user:
                raise ValidationError("You can only upload resources for your own subjects.")
        
        serializer.save()


@api_view(['GET'])
@permission_classes_decorator([permissions.IsAuthenticated, IsAdmin | IsHead])
def dashboard_stats(request):
    """Return aggregate counts for the admin dashboard."""
    college = request.user.college
    return Response({
        'total_students': Student.objects.filter(user__college=college).count(),
        'total_teachers': Teacher.objects.filter(user__college=college).count(),
        'total_subjects': Subject.objects.filter(college=college).count(),
        'total_enrollments': Enrollment.objects.filter(
            student__user__college=college, is_active=True
        ).count(),
        'total_batches': Batch.objects.filter(college=college).count(),
        'total_departments': Department.objects.filter(college=college).count(),
    })
