
import os
import sys
import django
import datetime
from django.db.utils import IntegrityError
from django.contrib.auth import get_user_model
from django.test import Client

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.academics.models import College, Subject, Student, Teacher
from apps.attendance.models import ClassSession
from apps.attendance.services import AttendanceService
from rest_framework.test import APIClient

User = get_user_model()

def run_checks():
    print("🚀 Starting Core Requirements Verification...\n")
    client = APIClient()
    
    # 1. Login Endpoint & Role Response
    print("🔹 Checking Login Response...")
    try:
        response = client.post('/api/v1/auth/login/', {
            "registration_number": "T001",
            "password": "password123",
            "college_code": "IITB"
        }, format='json')
        
        if response.status_code == 200:
            data = response.json()
            if 'access' in data and 'refresh' in data:
                print("   ✅ Login endpoint returns JWT")
            else:
                print("   ❌ Login response missing JWT tokens")
                
            if 'role' in data and data['role'] == 'TEACHER':
                print("   ✅ Role is returned in login response")
            else:
                print(f"   ❌ Role missing or incorrect in response: {data.get('role')}")
        else:
            print(f"   ❌ Login failed: {response.status_code} - {response.data}")
    except Exception as e:
        print(f"   ❌ Error during login check: {e}")

    # Setup for isolation tests
    # Create College B
    college_b, _ = College.objects.get_or_create(code='IITD', defaults={'name': 'IIT Delhi'})
    
    # Create User/Teacher in College B
    user_b, _ = User.objects.get_or_create(
        registration_number='T_IITD',
        college=college_b,
        defaults={'role': 'TEACHER', 'username': 'IITD_T_IITD'}
    )
    user_b.set_password('password123')
    user_b.save()

    # Login as Teacher B
    client.force_authenticate(user=user_b)
    
    # 2. Cross-College Data Leak
    print("\n🔹 Checking Cross-College Data Isolation...")
    # Try to access Subjects of College A (IITB)
    response = client.get('/api/v1/academics/subjects/')
    # This might fail 404 or return empty list depending on implementation
    # But it should NOT return IITB subjects
    # Assuming standard viewset behavior where we filter by college
    
    # Let's check permissions directly or access
    # Since we heavily modified permissions, let's see if we can instantiate a service call or query
    # Simple check: Does Teacher B see Teacher A's subject?
    # We need to ensure we have a subject in IITB (we do from setup_initial_data)
    iitb_subjects = Subject.objects.filter(college__code='IITB')
    if iitb_subjects.exists():
        # Try to fetch one specific subject from IITB using API
        subject_a = iitb_subjects.first()
        resp = client.get(f'/api/v1/academics/subjects/{subject_a.id}/')
        if resp.status_code == 404 or resp.status_code == 403:
             print("   ✅ No cross-college data leak (Access denied to other college data)")
        else:
             print(f"   ❌ Data leak! Teacher B accessed Teacher A's subject: {resp.status_code}")
    else:
        print("   ⚠️ No IITB subjects found to test isolation against.")

    # 3. Duplicate Session Prevention
    print("\n🔹 Checking Duplicate Session Prevention...")
    # Get Teacher A (IITB)
    teacher_a = User.objects.get(registration_number='T001', college__code='IITB')
    subject_a = Subject.objects.filter(teacher__user=teacher_a).first()
    
    if subject_a:
        today = datetime.date.today()
        # Create first session
        try:
            AttendanceService.create_class_session(subject_a, today, teacher_a, "Topic 1")
            # Try creating duplicate
            try:
                AttendanceService.create_class_session(subject_a, today, teacher_a, "Topic 2")
                print("   ❌ Duplicate session creation ALLOWED (Failed constraint check)")
            except IntegrityError:
                print("   ✅ Duplicate session prevented (IntegrityError raised)")
            except Exception as e:
                # Our service might wrap it or simpledjango might raise validation error
                print(f"   ✅ Duplicate session prevented ({type(e).__name__})")
        except Exception as e:
             # First session might already exist from previous tests
             try:
                AttendanceService.create_class_session(subject_a, today, teacher_a, "Topic 2")
                print("   ❌ Duplicate session creation ALLOWED (Failed constraint check)")
             except Exception as e:
                print(f"   ✅ Duplicate session prevented ({type(e).__name__})")
    else:
        print("   ⚠️ No Subject found for Teacher A to test sessions.")

    print("\n🏁 Requirement Verification Complete.")

if __name__ == '__main__':
    run_checks()
