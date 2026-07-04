from django.db import models
from django.utils.translation import gettext_lazy as _
from datetime import date
from apps.common.models import TimeStampedModel
from apps.common.constants import RiskLevel
from apps.academics.models import Student

class Prediction(TimeStampedModel):
    """
    Stores AI-generated performance predictions and risk assessments.
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='predictions')
    predicted_gpa = models.DecimalField(_('predicted GPA'), max_digits=4, decimal_places=2, null=True, blank=True)
    risk_level = models.CharField(
        _('risk level'), 
        max_length=20, 
        choices=RiskLevel.choices, 
        default=RiskLevel.LOW
    )
    risk_score = models.DecimalField(_('risk score'), max_digits=5, decimal_places=4, help_text=_('Probability of failure/dropout (0-1)'))
    
    # Metadata about the prediction run
    prediction_date = models.DateField(default=date.today)
    model_version = models.CharField(max_length=50, default='v1.0')
    
    # ML output storage
    recommendations = models.JSONField(
        _('recommendations'),
        default=list,
        blank=True,
        help_text=_('List of personalized recommendation strings.')
    )
    features_snapshot = models.JSONField(
        _('features snapshot'),
        default=dict,
        blank=True,
        help_text=_('Feature values used for this prediction.')
    )

    class Meta:
        indexes = [
            models.Index(fields=['student', 'risk_level'], name='student_risk_idx'),
            models.Index(fields=['risk_level'], name='risk_level_lookup_idx'),
        ]
        get_latest_by = 'created_at'

    def __str__(self):
        return f"{self.student} - {self.risk_level} ({self.predicted_gpa})"
