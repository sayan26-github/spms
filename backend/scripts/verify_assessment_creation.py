import os
import sys
import django

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.assessments.views import AssessmentViewSet
from apps.users.models import User
from apps.academics.models import Subject
from apps.users.models import User
from apps.academics.models import Subject

def test_create_assessment():
    try:
        # Get the teacher
        user = User.objects.filter(email='prof.sharma@iitb.ac.in').first()
        if not user:
            print("Teacher user not found.")
            return
        
        print(f"User: {user.email} (Role: {user.role})")

        # Get a subject assigned to this teacher
        subject = Subject.objects.filter(teacher__user=user).first()
        if not subject:
            print("No subject assigned to this teacher. Cannot test creation.")
            return
        
        print(f"Target Subject: {subject.name} (ID: {subject.id})")

        # Prepare Payload
        payload = {
            "subject": subject.id,
            "name": "Scripted Unit Test",
            "max_marks": 50,
            "date": "2026-03-01"
            # leaving out type and weightage to test defaults
        }

        print(f"Payload: {payload}")

        # Simulate Request
        factory = APIRequestFactory()
        view = AssessmentViewSet.as_view({'post': 'create'})
        
        request = factory.post('/api/v1/assessments/tests/', payload, format='json')
        force_authenticate(request, user=user)
        
        response = view(request)
        
        print("\nResponse Status Code:", response.status_code)
        print("Response Data:", response.data)
        
        if response.status_code == 201:
            print("\nSUCCESS: Assessment created.")
        else:
            print("\nFAILURE: Assessment creation failed.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_create_assessment()
