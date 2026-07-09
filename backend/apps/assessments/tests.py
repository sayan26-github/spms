from django.test import TestCase
from django.utils import timezone
from apps.academics.models import College, Subject, Department, Batch, Student, Enrollment
from apps.users.models import User, UserRole
from apps.assessments.models import Assessment, Marks
from apps.common.constants import AssessmentType
from apps.assessments.services import AssessmentService

class AssessmentTestCase(TestCase):
    def setUp(self):
        # Create college
        self.college = College.objects.create(name='Test College', address='Test Address', code='TEST')
        
        self.batch = Batch.objects.create(college=self.college, name='2024', year=2024)
        self.department = Department.objects.create(college=self.college, name='CS', code='CS', batch=self.batch)
        
        # Create a teacher
        self.teacher_user = User.objects.create_user(
            email='teacher@test.com',
            password='password123',
            role=UserRole.TEACHER,
            college=self.college,
            first_name='Teacher',
            last_name='User',
            registration_number='T123'
        )
        
        # Create a student
        self.student_user = User.objects.create_user(
            email='student@test.com',
            password='password123',
            role=UserRole.STUDENT,
            college=self.college,
            first_name='Student',
            last_name='User',
            registration_number='REG123'
        )
        self.student = Student.objects.get(user=self.student_user)
        self.student.batch = self.batch
        self.student.department = self.department
        self.student.save()
        
        # Create subjects
        self.subject1 = Subject.objects.create(
            college=self.college, name='Subj 1', code='S1', semester=1
        )
        self.subject2 = Subject.objects.create(
            college=self.college, name='Subj 2', code='S2', semester=1
        )
        
        # Enroll
        Enrollment.objects.create(student=self.student, subject=self.subject1, is_active=True)
        Enrollment.objects.create(student=self.student, subject=self.subject2, is_active=True)

        # Create assessments
        self.assessment1 = Assessment.objects.create(
            college=self.college,
            subject=self.subject1,
            name='Midterm',
            assessment_type=AssessmentType.INTERNAL_1,
            max_marks=100,
            date=timezone.now().date(),
            created_by=self.teacher_user
        )
        self.assessment2 = Assessment.objects.create(
            college=self.college,
            subject=self.subject2,
            name='Finals',
            assessment_type=AssessmentType.SEMESTER,
            max_marks=100,
            date=timezone.now().date(),
            created_by=self.teacher_user
        )

    def test_bulk_add_marks(self):
        marks_data = [
            {'student_id': self.student.id, 'marks': 85.0}
        ]
        AssessmentService.bulk_add_marks(self.assessment1, marks_data)
        
        mark = Marks.objects.get(assessment=self.assessment1, student=self.student)
        self.assertEqual(mark.marks_obtained, 85.0)
        self.assertEqual(mark.college, self.college)
        
    def test_aggregation_correctness(self):
        # Add marks for subj1 (85/100) -> 85% -> A+ -> 9 points
        AssessmentService.bulk_add_marks(self.assessment1, [{'student_id': self.student.id, 'marks': 85.0}])
        
        # Add marks for subj2 (65/100) -> 65% -> B+ -> 7 points
        AssessmentService.bulk_add_marks(self.assessment2, [{'student_id': self.student.id, 'marks': 65.0}])
        
        # Total points = 9 + 7 = 16
        # Total subjects = 2
        # Expected SGPA = 16 / 2 = 8.00
        
        transcript = AssessmentService.generate_student_transcript(self.student.id)
        
        self.assertAlmostEqual(transcript['overall_cgpa'], 8.00, places=2)
        
        # Verify subject grades
        sem = transcript['semesters'][0]
        subj1_res = next(r for r in sem['subjects'] if r['id'] == self.subject1.id)
        self.assertEqual(subj1_res['grade'], 'A+')
        self.assertEqual(subj1_res['grade_points'], 9)
        
        subj2_res = next(r for r in sem['subjects'] if r['id'] == self.subject2.id)
        self.assertEqual(subj2_res['grade'], 'B+')
        self.assertEqual(subj2_res['grade_points'], 7)
