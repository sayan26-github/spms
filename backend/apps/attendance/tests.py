from django.test import TestCase
from django.utils import timezone
from apps.academics.models import College, Subject, Department, Batch, Student, Enrollment
from apps.users.models import User, UserRole
from apps.attendance.models import ClassSession, Attendance
from apps.common.constants import AttendanceStatus
from apps.attendance.services import AttendanceService
from django.core.exceptions import ValidationError

class AttendanceTestCase(TestCase):
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
        
        # Create another student
        self.student_user2 = User.objects.create_user(
            email='student2@test.com',
            password='password123',
            role=UserRole.STUDENT,
            college=self.college,
            first_name='Student2',
            last_name='User2',
            registration_number='REG124'
        )
        self.student2 = Student.objects.get(user=self.student_user2)
        self.student2.batch = self.batch
        self.student2.department = self.department
        self.student2.save()
        
        # Create a subject
        self.subject = Subject.objects.create(
            college=self.college,
            name='Test Subject',
            code='SUBJ1',
            semester=1
        )
        self.subject.teacher = None  # Just keeping it simple
        self.subject.save()
        
        # Enroll both students
        Enrollment.objects.create(student=self.student, subject=self.subject, is_active=True)
        Enrollment.objects.create(student=self.student2, subject=self.subject, is_active=True)

    def test_create_class_session_defaults_to_absent(self):
        date = timezone.now().date()
        session = AttendanceService.create_class_session(self.subject, date, self.teacher_user, 'Intro')
        
        # Assert session created correctly
        self.assertEqual(session.subject, self.subject)
        self.assertEqual(session.college, self.college)
        
        # Assert attendance records created for all enrolled students
        attendances = Attendance.objects.filter(class_session=session)
        self.assertEqual(attendances.count(), 2)
        
        # Unmarked students default to ABSENT
        for att in attendances:
            self.assertEqual(att.status, AttendanceStatus.ABSENT)
            self.assertEqual(att.college, self.college)

    def test_duplicate_session_fails(self):
        date = timezone.now().date()
        AttendanceService.create_class_session(self.subject, date, self.teacher_user, 'Intro')
        
        # Should raise ValidationError on duplicate
        with self.assertRaises(ValidationError):
            AttendanceService.create_class_session(self.subject, date, self.teacher_user, 'Intro 2')

    def test_update_attendance(self):
        date = timezone.now().date()
        session = AttendanceService.create_class_session(self.subject, date, self.teacher_user, 'Intro')
        
        # Update attendance for student 1 to present
        attendance_data = [{'student_id': self.student.id, 'status': AttendanceStatus.PRESENT}]
        AttendanceService.update_attendance(session.id, attendance_data)
        
        # Check updates
        att1 = Attendance.objects.get(class_session=session, student=self.student)
        att2 = Attendance.objects.get(class_session=session, student=self.student2)
        
        self.assertEqual(att1.status, AttendanceStatus.PRESENT)
        # Student 2 was not updated, should remain ABSENT
        self.assertEqual(att2.status, AttendanceStatus.ABSENT)
