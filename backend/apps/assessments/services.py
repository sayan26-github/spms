from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Assessment, Marks

class AssessmentService:
    @staticmethod
    def bulk_add_marks(assessment, marks_data):
        """
        Bulk adds marks for a specific assessment.
        marks_data: list of dicts [{'student_id': 1, 'marks': 85.5}, ...]
        """
        # 1. Get list of student IDs from input
        student_ids = [item.get('student_id') for item in marks_data if item.get('student_id')]
        
        # 2. Validate that these students are enrolled in the subject
        # Filtering by subject__enrollments ensures they are valid students for this subject
        valid_student_ids = set(
            assessment.subject.enrollments.filter(
                student_id__in=student_ids, 
                is_active=True
            ).values_list('student_id', flat=True)
        )

        with transaction.atomic():
            for record in marks_data:
                student_id = record.get('student_id')
                marks_obtained = record.get('marks')
                remarks = record.get('remarks', '')

                if student_id and marks_obtained is not None:
                    if student_id not in valid_student_ids:
                        # Skip or raise error? skipping for bulk leniency, or could log.
                        # For strictness, let's skip but maybe we should warn.
                        continue

                    # Use update_or_create to handle re-uploads
                    Marks.objects.update_or_create(
                        assessment=assessment,
                        student_id=student_id,
                        defaults={
                            'marks_obtained': marks_obtained,
                            'remarks': remarks
                        }
                    )
        return True
