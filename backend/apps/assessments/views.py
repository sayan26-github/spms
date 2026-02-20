from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import IsTeacher, IsAdmin, IsSameCollege
from .models import Assessment, Marks
from .serializers import AssessmentSerializer, MarksSerializer, BulkMarksSerializer
from .services import AssessmentService
from apps.academics.models import Subject
from django.core.exceptions import ValidationError

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
            return Assessment.objects.filter(subject__teacher__user=user)
        elif user.role == 'STUDENT':
            return Assessment.objects.filter(subject__enrollments__student__user=user).distinct()
        return Assessment.objects.none()

    def perform_create(self, serializer):
        # Additional check: ensure subject belongs to user's college and teacher
        subject = serializer.validated_data['subject']
        if subject.college != self.request.user.college:
             raise ValidationError("Subject must belong to your college.")
        
        if self.request.user.role == 'TEACHER':
            if not subject.teacher or subject.teacher.user != self.request.user:
                 raise ValidationError("You can only create assessments for your subjects.")

        serializer.save(created_by=self.request.user)

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
        if user.role in ['ADMIN', 'HEAD']:
            return Marks.objects.filter(assessment__subject__college=user.college)
        elif user.role == 'TEACHER':
            return Marks.objects.filter(assessment__subject__teacher__user=user)
        elif user.role == 'STUDENT':
            return Marks.objects.filter(student__user=user)
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
            if request.user.role == 'TEACHER' and assessment.subject.teacher.user != request.user:
                return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            if assessment.subject.college != request.user.college:
                return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
            AssessmentService.bulk_add_marks(assessment, marks_data)
            return Response({"detail": "Marks updated successfully"}, status=status.HTTP_200_OK)

        except Assessment.DoesNotExist:
            return Response({"detail": "Assessment not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
