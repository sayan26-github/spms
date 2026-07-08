import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.academics.models import College
from apps.analytics.services import AnalyticsService

def main():
    college = College.objects.get(code='GTU')
    print(f"Testing for college: {college}")
    try:
        count = AnalyticsService.run_batch_predictions(college)
        print(f"Success! Generated {count} predictions.")
        
        preds = AnalyticsService.Prediction.objects.filter(student__user__college=college)
        print(f"Total predictions saved: {preds.count()}")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
