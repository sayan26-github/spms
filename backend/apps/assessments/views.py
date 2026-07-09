from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import IsTeacher, IsAdmin, IsSameCollege
from .models import Assessment, Marks
from .serializers import AssessmentSerializer, MarksSerializer, BulkMarksSerializer
from .services import AssessmentService
from apps.academics.models import Subject, Student
from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

class AssessmentViewSet(viewsets.ModelViewSet):
    """
    Manage Assessments.
    """
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'HEAD']:
            return Assessment.objects.filter(subject__college=user.college)
        elif user.role == 'TEACHER':
            return Assessment.objects.filter(subject__teacher__user=user, subject__college=user.college)
        elif user.role == 'STUDENT':
            return Assessment.objects.filter(subject__enrollments__student__user=user, subject__college=user.college).distinct()
        return Assessment.objects.none()

    def perform_create(self, serializer):
        # Additional check: ensure subject belongs to user's college and teacher
        subject = serializer.validated_data['subject']
        if subject.college != self.request.user.college:
             raise DRFValidationError("Subject must belong to your college.")
        
        if self.request.user.role == 'TEACHER':
            if not subject.teacher or subject.teacher.user != self.request.user:
                 raise DRFValidationError("You can only create assessments for your subjects.")

        serializer.save(created_by=self.request.user, college=self.request.user.college)

    @action(detail=True, methods=['get'])
    def sheet(self, request, pk=None):
        """
        Get the 'mark sheet' for this assessment.
        Returns list of all enrolled students with their current marks (or null).
        """
        assessment = self.get_object()
        
        # 1. Get all enrolled students for the subject
        enrollments = assessment.subject.enrollments.filter(is_active=True).select_related('student__user')
        
        # 2. Get existing marks
        marks_map = {
            m.student_id: m 
            for m in Marks.objects.filter(assessment=assessment)
        }
        
        # 3. Build response
        sheet_data = []
        for enrollment in enrollments:
            student = enrollment.student
            existing_mark = marks_map.get(student.id)
            
            sheet_data.append({
                "student_id": student.id,
                "student_name": student.user.get_full_name(),
                "student_reg_no": student.user.registration_number,
                "marks_obtained": existing_mark.marks_obtained if existing_mark else None,
                "remarks": existing_mark.remarks if existing_mark else ""
            })
            
        # Sort by Reg No
        sheet_data.sort(key=lambda x: x['student_reg_no'])
        
        return Response(sheet_data)

class MarksViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only marks view. 
    Updates via bulk endpoint on Assessment or custom action.
    """
    serializer_class = MarksSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = Marks.objects.select_related(
            'assessment__subject', 'student__user'
        )
        if user.role in ['ADMIN', 'HEAD']:
            return base_qs.filter(assessment__subject__college=user.college)
        elif user.role == 'TEACHER':
            return base_qs.filter(assessment__subject__teacher__user=user, assessment__subject__college=user.college)
        elif user.role == 'STUDENT':
            return base_qs.filter(student__user=user, assessment__subject__college=user.college)
        return Marks.objects.none()

    @action(detail=False, methods=['post'], url_path='update-bulk', permission_classes=[IsTeacher | IsAdmin])
    def update_bulk(self, request):
        """
        Bulk update marks for a specific assessment.
        Expects: { "assessment_id": 1, "marks": [{ "student_id": 1, "marks": 85 }] }
        """
        assessment_id = request.data.get('assessment_id')
        marks_data = request.data.get('marks')

        if not assessment_id or not marks_data:
            return Response({"detail": "Assessment ID and marks data required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            assessment = Assessment.objects.get(id=assessment_id)
            if request.user.role == 'TEACHER':
                if not assessment.subject.teacher or assessment.subject.teacher.user != request.user:
                    return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            if assessment.subject.college != request.user.college:
                return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
            AssessmentService.bulk_add_marks(assessment, marks_data)
            return Response({"detail": "Marks updated successfully"}, status=status.HTTP_200_OK)

        except Assessment.DoesNotExist:
            return Response({"detail": "Assessment not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TranscriptView(APIView):
    """
    Generate student transcript data (Marks and Attendance)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        student = get_object_or_404(Student, id=student_id)
        
        if request.user.role in ['ADMIN', 'HEAD']:
            if student.user.college != request.user.college:
                return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role == 'TEACHER':
            if student.user.college != request.user.college:
                return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            if not student.enrollments.filter(subject__teacher__user=request.user, is_active=True).exists():
                return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role == 'STUDENT':
            if student.user != request.user:
                return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        data = AssessmentService.generate_student_transcript(student_id)
        return Response(data)

class MyTranscriptView(APIView):
    """
    Generate student transcript data for the currently logged-in student.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'STUDENT':
            return Response({"detail": "Only students can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        
        student = get_object_or_404(Student, user=request.user)
        data = AssessmentService.generate_student_transcript(student.id)
        return Response(data)

from .models import AssignmentTask, AssignmentSubmission
from .serializers import AssignmentTaskSerializer, AssignmentSubmissionSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class AssignmentTaskViewSet(viewsets.ModelViewSet):
    """
    Manage AssignmentTasks.
    Teachers create and manage them. Students can only view.
    """
    serializer_class = AssignmentTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'HEAD']:
            return AssignmentTask.objects.filter(subject__college=user.college)
        elif user.role == 'TEACHER':
            return AssignmentTask.objects.filter(subject__teacher__user=user, subject__college=user.college)
        elif user.role == 'STUDENT':
            return AssignmentTask.objects.filter(subject__enrollments__student__user=user, subject__enrollments__is_active=True, subject__college=user.college).distinct()
        return AssignmentTask.objects.none()

    def perform_create(self, serializer):
        subject = serializer.validated_data['subject']
        if subject.college != self.request.user.college:
             raise DRFValidationError("Subject must belong to your college.")
        
        if self.request.user.role == 'TEACHER':
            if not subject.teacher or subject.teacher.user != self.request.user:
                 raise DRFValidationError("You can only create assignments for your subjects.")

        serializer.save(created_by=self.request.user, college=self.request.user.college)

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    """
    Manage student submissions for AssignmentTasks.
    Students upload submissions. Teachers grade them.
    """
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        assignment_id = self.request.query_params.get('assignment', None)
        qs = AssignmentSubmission.objects.select_related('assignment__subject__teacher__user', 'student__user')

        if user.role in ['ADMIN', 'HEAD']:
            qs = qs.filter(assignment__subject__college=user.college)
        elif user.role == 'TEACHER':
            qs = qs.filter(assignment__subject__teacher__user=user, assignment__subject__college=user.college)
        elif user.role == 'STUDENT':
            qs = qs.filter(student__user=user, assignment__subject__college=user.college)
        else:
            qs = qs.none()

        if assignment_id:
            qs = qs.filter(assignment_id=assignment_id)
            
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'STUDENT':
            raise DRFValidationError("Only students can submit assignments.")

        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            raise DRFValidationError("Student profile not found.")

        assignment = serializer.validated_data['assignment']
        
        # Check enrollment
        if not assignment.subject.enrollments.filter(student=student, is_active=True).exists():
            raise DRFValidationError("You are not enrolled in this subject.")

        serializer.save(student=student, college=self.request.user.college)

    @action(detail=True, methods=['patch'], permission_classes=[IsTeacher | IsAdmin])
    def grade(self, request, pk=None):
        """
        Action for a teacher to grade a submission.
        """
        submission = self.get_object()
        marks = request.data.get('marks_obtained')
        remarks = request.data.get('remarks', submission.remarks)

        try:
            submission = AssessmentService.grade_submission(submission, marks, remarks)
            return Response(self.get_serializer(submission).data)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"detail": "Invalid marks format"}, status=status.HTTP_400_BAD_REQUEST)
