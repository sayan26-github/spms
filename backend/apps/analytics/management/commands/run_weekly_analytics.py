from django.core.management.base import BaseCommand
from apps.academics.models import College
from apps.analytics.services import AnalyticsService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Run batch ML predictions and send proactive teacher alerts for all colleges.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting Weekly Analytics & Alerts Job...'))
        colleges = College.objects.all()
        
        total_preds = 0
        total_alerts = 0
        
        for college in colleges:
            self.stdout.write(f'Processing college: {college.name}')
            
            # Step 1: Run ML predictions for all students
            num_predictions = AnalyticsService.run_batch_predictions(college)
            self.stdout.write(self.style.SUCCESS(f'  -> Generated {num_predictions} predictions.'))
            total_preds += num_predictions
            
            # Step 2: Send proactive alerts to teachers for HIGH risk students
            alerts_sent = AnalyticsService.send_proactive_alerts(college)
            self.stdout.write(self.style.SUCCESS(f'  -> Sent {alerts_sent} proactive alerts to teachers.'))
            total_alerts += alerts_sent
            
        self.stdout.write(self.style.SUCCESS(f'Job completed! Total Predictions: {total_preds} | Total Alerts: {total_alerts}'))
