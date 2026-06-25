from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.academics.models import College, Teacher, Student, Subject, Enrollment, Department, Batch
from apps.common.constants import UserRole

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates initial data for the SPMS application'

    def handle(self, *args, **kwargs):
        self.stdout.write("Creating initial data...")

        # 1. Create College
        college, created = College.objects.get_or_create(
            code='IITB',
            defaults={
                'name': 'Indian Institute of Technology, Bombay',
                'contact_email': 'admin@iitb.ac.in',
                'contact_phone': '022-2576-7900'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"[OK] College created: {college.name} ({college.code})"))
        else:
            self.stdout.write(f"[INFO] College already exists: {college.name}")

        # Ensure Department and Batch exist
        dept, _ = Department.objects.get_or_create(
            college=college,
            code='CSE',
            defaults={'name': 'Computer Science and Engineering'}
        )
        
        batch, _ = Batch.objects.get_or_create(
            college=college,
            name='2024-2028',
            defaults={'year': 2024}
        )

        # 2. Create Superuser
        admin_reg_no = 'ADMIN001'
        if not User.objects.filter(registration_number=admin_reg_no, college=college).exists():
            User.objects.create_superuser(
                registration_number=admin_reg_no,
                password='password123',
                college=college,
                email='head@iitb.ac.in',
                first_name='Admin',
                last_name='User',
                role=UserRole.ADMIN
            )
            self.stdout.write(self.style.SUCCESS(f"[OK] Superuser created: {admin_reg_no}"))

        # 3. Create Teachers
        teachers_data = [
            {'reg': 'T001', 'email': 'prof.sharma@iitb.ac.in', 'first': 'Rohit', 'last': 'Sharma'},
            {'reg': 'T002', 'email': 'prof.gupta@iitb.ac.in', 'first': 'Meera', 'last': 'Gupta'},
            {'reg': 'T003', 'email': 'prof.iyer@iitb.ac.in', 'first': 'Venkat', 'last': 'Iyer'},
        ]
        
        teacher_profiles = {}
        for td in teachers_data:
            u, _ = User.objects.get_or_create(
                registration_number=td['reg'], college=college,
                defaults={
                    'password': 'password123', 'email': td['email'],
                    'first_name': td['first'], 'last_name': td['last'],
                    'role': UserRole.TEACHER
                }
            )
            u.set_password('password123')
            u.save()
            tp, _ = Teacher.objects.get_or_create(
                user=u, defaults={'department': dept.name, 'designation': 'Professor'}
            )
            teacher_profiles[td['reg']] = tp
            self.stdout.write(self.style.SUCCESS(f"[OK] Teacher created/updated: {td['reg']}"))

        # 4. Create Subjects
        subjects_data = [
            {'code': 'CS101', 'name': 'Data Structures', 'sem': 3, 'teacher_reg': 'T001'},
            {'code': 'CS102', 'name': 'Operating Systems', 'sem': 3, 'teacher_reg': 'T002'},
            {'code': 'CS103', 'name': 'Computer Networks', 'sem': 3, 'teacher_reg': 'T003'},
            {'code': 'CS104', 'name': 'Database Management', 'sem': 3, 'teacher_reg': 'T001'},
            {'code': 'CS105', 'name': 'Machine Learning', 'sem': 4, 'teacher_reg': 'T002'}, # Next sem
        ]
        
        subject_objects = []
        for sd in subjects_data:
            s, _ = Subject.objects.get_or_create(
                code=sd['code'], college=college,
                defaults={
                    'name': sd['name'], 'semester': sd['sem'],
                    'teacher': teacher_profiles[sd['teacher_reg']]
                }
            )
            s.teacher = teacher_profiles[sd['teacher_reg']]
            s.save()
            subject_objects.append(s)
            self.stdout.write(self.style.SUCCESS(f"[OK] Subject created/updated: {sd['code']}"))

        # 5. Create Students
        students_data = [
            {'reg': 'S001', 'email': 'rahul@iitb.ac.in', 'first': 'Rahul', 'last': 'Verma'},
            {'reg': 'S002', 'email': 'priya@iitb.ac.in', 'first': 'Priya', 'last': 'Singh'},
            {'reg': 'S003', 'email': 'amit@iitb.ac.in', 'first': 'Amit', 'last': 'Kumar'},
            {'reg': 'S004', 'email': 'sneha@iitb.ac.in', 'first': 'Sneha', 'last': 'Patil'},
            {'reg': 'S005', 'email': 'vikram@iitb.ac.in', 'first': 'Vikram', 'last': 'Joshi'},
        ]
        
        student_profiles = []
        for sd in students_data:
            u, _ = User.objects.get_or_create(
                registration_number=sd['reg'], college=college,
                defaults={
                    'password': 'password123', 'email': sd['email'],
                    'first_name': sd['first'], 'last_name': sd['last'],
                    'role': UserRole.STUDENT
                }
            )
            u.set_password('password123')
            u.save()
            sp, _ = Student.objects.get_or_create(
                user=u,
                defaults={
                    'department': dept, 'batch': batch, 'semester': 3
                }
            )
            sp.department = dept
            sp.batch = batch
            sp.semester = 3
            sp.save()
            student_profiles.append(sp)
            self.stdout.write(self.style.SUCCESS(f"[OK] Student created/updated: {sd['reg']}"))

        # 6. Enroll Students in Current Semester Subjects
        for sp in student_profiles:
            for sub in subject_objects:
                if sub.semester == 3: # Enroll only in current semester
                    Enrollment.objects.get_or_create(student=sp, subject=sub, defaults={'is_active': True})
            self.stdout.write(self.style.SUCCESS(f"[OK] Enrolled student {sp.user.registration_number} in Semester 3 subjects"))

        self.stdout.write(self.style.SUCCESS("[OK] Initial data setup completed successfully!"))
