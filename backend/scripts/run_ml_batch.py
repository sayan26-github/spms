import os
import sys

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from apps.academics.models import College
from apps.analytics.services import AnalyticsService

def run():
    print("Fetching College 'DCE'...")
    try:
        college = College.objects.get(code='DCE')
    except College.DoesNotExist:
        print("College 'DCE' not found. Ensure populate_dce.py has been run.")
        return

    print("Triggering ML Batch Predictions...")
    count = AnalyticsService.run_batch_predictions(college)
    print(f"ML Batch Predictions completed successfully for {count} students.")

if __name__ == "__main__":
    run()
