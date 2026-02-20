
import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.academics.models import College, Batch, Department, Student
from apps.users.models import User
from django.db import transaction

def verify_structure():
    print("Verifying Admin Structure...")
    
    try:
        with transaction.atomic():
            # 1. Create College
            college, _ = College.objects.get_or_create(name="Test College", code="TEST01")
            print(f"College: {college.name}")

            # 2. Create Batch
            batch, _ = Batch.objects.get_or_create(college=college, name="Batch 2026", year=2026)
            print(f"Batch Created: {batch.name}")

            # 3. Create Department
            dept, _ = Department.objects.get_or_create(college=college, name="Computer Science", code="CSE")
            print(f"Department Created: {dept.name}")

            # 4. Create User (Student)
            user, created = User.objects.get_or_create(
                registration_number="TEST_REG_01",
                defaults={
                    'first_name': "Test",
                    'last_name': "Student",
                    'email': "test@student.com",
                    'college': college,
                    'role': 'STUDENT',
                    'password': 'password123' 
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            print(f"User Created: {user.registration_number}")

            # 5. Create Student Profile linked to Batch and Dept
            # Note: Signal might have created a profile already, let's check.
            if hasattr(user, 'student_profile'):
                student = user.student_profile
                student.batch = batch
                student.department = dept
                student.save()
                print("Student Profile Updated via Signal/Existing.")
            else:
                student = Student.objects.create(
                    user=user,
                    college=college,
                    batch=batch,
                    department=dept,
                    semester=1
                )
                print("Student Profile Created Manually.")

            # 6. Verify Relations
            fetched_student = Student.objects.get(user=user)
            assert fetched_student.batch == batch
            assert fetched_student.department == dept
            print(f"✅ Verification Successful: Student {fetched_student.user.first_name} is in {fetched_student.batch.name}, {fetched_student.department.name}")
            
            # Cleanup (optional, rolling back transaction would be cleaner but this is a script)
            # raise Exception("Rollback for test") 

    except Exception as e:
        print(f"❌ Verification Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_structure()
