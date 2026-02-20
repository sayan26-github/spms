import os
import sys
import django

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.academics.views import SubjectViewSet
from apps.users.models import User
from apps.users.models import User

def verify_subjects_api():
    try:
        # Get the teacher
        user = User.objects.filter(email='prof.sharma@iitb.ac.in').first()
        if not user:
            print("Teacher user not found.")
            return

        print(f"Acting as User: {user.email}")
        
        # Simulate Request
        factory = APIRequestFactory()
        view = SubjectViewSet.as_view({'get': 'list'})
        
        request = factory.get('/api/v1/academics/subjects/')
        force_authenticate(request, user=user)
        
        response = view(request)
        
        print("\nResponse Status Code:", response.status_code)
        
        data = response.data
        if isinstance(data, dict) and 'results' in data:
            print("Response Format: Pagination Object")
            print(f"Count: {data['count']}")
            print(f"Results: {len(data['results'])}")
            print("First Result:", data['results'][0] if data['results'] else "None")
        elif isinstance(data, list):
            print("Response Format: List")
            print(f"Count: {len(data)}")
            print("First Result:", data[0] if data else "None")
        else:
            print("Response Format: Unknown/Other")
            print(data)

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    verify_subjects_api()
