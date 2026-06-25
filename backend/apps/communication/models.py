from django.db import models
from apps.users.models import User
from apps.academics.models import College, Subject
from apps.common.constants import NotificationType
from apps.common.models import TimeStampedModel

class Message(TimeStampedModel):
    """
    Direct messages between users within the same college.
    """
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    subject = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender']),
            models.Index(fields=['receiver']),
            models.Index(fields=['college']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"From {self.sender} to {self.receiver}: {self.subject}"

class Notification(TimeStampedModel):
    """
    System notifications for users.
    """
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20, 
        choices=NotificationType.choices, 
        default=NotificationType.SYSTEM
    )
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"{self.title} -> {self.recipient}"

class Feedback(TimeStampedModel):
    """
    Feedback from students about subjects/courses.
    """
    college = models.ForeignKey(
        College, on_delete=models.CASCADE, related_name='feedbacks'
    )
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], help_text="Rating from 1 to 5")
    comments = models.TextField()
    is_anonymous = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'subject'],
                name='unique_feedback_per_student_subject'
            )
        ]
        indexes = [
            models.Index(fields=['subject']),
            models.Index(fields=['college']),
        ]

    def __str__(self):
        return f"Feedback for {self.subject} ({self.rating}/5)"
