from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.academics.models import College
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
            self.stdout.write(self.style.SUCCESS(f"✅ College created: {college.name} ({college.code})"))
        else:
            self.stdout.write(f"ℹ️ College already exists: {college.name}")

        # 2. Create Superuser (College Head/Admin)
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
            self.stdout.write(self.style.SUCCESS(f"✅ Superuser created: Reg No: {admin_reg_no}, Pass: password123"))
        else:
            self.stdout.write(f"ℹ️ Superuser already exists: {admin_reg_no}")

        # 3. Create Teacher
        teacher_reg_no = 'T001'
        if not User.objects.filter(registration_number=teacher_reg_no, college=college).exists():
            User.objects.create_user(
                registration_number=teacher_reg_no,
                password='password123',
                college=college,
                email='prof.sharma@iitb.ac.in',
                first_name='Rohit',
                last_name='Sharma',
                role=UserRole.TEACHER
            )
            self.stdout.write(self.style.SUCCESS(f"✅ Teacher created: Reg No: {teacher_reg_no}, Pass: password123"))
        else:
            self.stdout.write(f"ℹ️ Teacher already exists: {teacher_reg_no}")

        # 4. Create Student
        student_reg_no = 'S001'
        if not User.objects.filter(registration_number=student_reg_no, college=college).exists():
            student_user = User.objects.create_user(
                registration_number=student_reg_no,
                password='password123',
                college=college,
                email='student@iitb.ac.in',
                first_name='Rahul',
                last_name='Verma',
                role=UserRole.STUDENT
            )
            self.stdout.write(self.style.SUCCESS(f"✅ Student created: Reg No: {student_reg_no}, Pass: password123"))
        else:
            student_user = User.objects.get(registration_number=student_reg_no, college=college)
            self.stdout.write(f"ℹ️ Student already exists: {student_reg_no}")

        # 5. Create Teacher Profile & Student Profile (if not signals)
        # Note: We should check if profiles exist or create them. 
        # For this script, we assume signals might handle it OR we manually create them if missing.
        # Let's import models first.
        from apps.academics.models import Teacher, Student, Subject, Enrollment

        teacher_profile, _ = Teacher.objects.get_or_create(
            user=User.objects.get(registration_number=teacher_reg_no, college=college),
            defaults={'department': 'Computer Science', 'designation': 'Professor'}
        )
        
        student_profile, _ = Student.objects.get_or_create(
            user=student_user,
            defaults={'batch_year': 2024, 'semester': 3}
        )

        # 6. Create Subject
        subject_code = 'CS101'
        subject, created = Subject.objects.get_or_create(
            code=subject_code,
            college=college,
            defaults={
                'name': 'Data Structures',
                'semester': 3,
                'teacher': teacher_profile
            }
        )
        if created:
             self.stdout.write(self.style.SUCCESS(f"✅ Subject created: {subject.name} ({subject.code})"))
        else:
             self.stdout.write(f"ℹ️ Subject already exists: {subject.name}")

        # 7. Enroll Student
        enrollment, created = Enrollment.objects.get_or_create(
            student=student_profile,
            subject=subject,
            defaults={'is_active': True}
        )
        if created:
             self.stdout.write(self.style.SUCCESS(f"✅ Student {student_user.first_name} enrolled in {subject.name}"))
        else:
             self.stdout.write(f"ℹ️ Student already enrolled in {subject.name}")
