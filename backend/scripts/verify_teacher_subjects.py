import os
import sys
import django

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.academics.models import Subject, Teacher

def verify_teacher_subjects():
    try:
        # Get the teacher user
        user = User.objects.filter(email='prof.sharma@iitb.ac.in').first()
        if not user:
            print("Teacher user not found.")
            return

        print(f"Teacher: {user.email}")
        
        if not hasattr(user, 'teacher_profile'):
             print("User has no teacher profile.")
             return
             
        teacher = user.teacher_profile
        print(f"Teacher Profile: {teacher}")
        
        # Check assigned subjects
        subjects = Subject.objects.filter(teacher=teacher)
        print(f"Assigned Subjects: {subjects.count()}")
        for s in subjects:
            print(f"- {s.name} ({s.code})")
            
        if subjects.count() == 0:
            print("WARNING: No subjects assigned to this teacher. Dashboard will be empty.")
            
            # Auto-assign a subject for testing
            subject = Subject.objects.filter(college=user.college).first()
            if subject:
                print(f"Assigning '{subject.name}' to {teacher}...")
                subject.teacher = teacher
                subject.save()
                print("Assigned.")
            else:
                print("No subjects found in college to assign.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    verify_teacher_subjects()
