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
from apps.assessments.models import Assessment
from apps.users.models import User
from apps.assessments.models import Assessment
from apps.users.models import User

def test_sheet_endpoint():
    try:
        # Get the assessment
        assessment = Assessment.objects.first()
        if not assessment:
            print("No assessment found.")
            return

        print(f"Testing sheet for Assessment: {assessment.id} - {assessment.name}")
        
        # Get a teacher user
        # We need the user who created it or has access
        user = assessment.created_by
        print(f"Acting as User: {user.email}")

        # Simulate Request
        factory = APIRequestFactory()
        view = AssessmentViewSet.as_view({'get': 'sheet'})
        
        request = factory.get(f'/api/v1/assessments/tests/{assessment.id}/sheet/')
        force_authenticate(request, user=user)
        
        response = view(request, pk=assessment.id)
        
        print("\nResponse Status Code:", response.status_code)
        # print("Response Data:", response.data)
        
        if response.status_code == 200:
            data = response.data
            print(f"Number of records: {len(data)}")
            if len(data) > 0:
                print("First record:", data[0])
                print("\nSUCCESS: Sheet data returned.")
            else:
                print("\nWARNING: Sheet data returned empty list.")
        else:
            print("\nFAILURE: Status code not 200.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_sheet_endpoint()
