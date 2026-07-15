from .models import Message, Notification, Feedback
from apps.common.constants import NotificationType

class CommunicationService:
    @staticmethod
    def create_message(sender, receiver, subject, body):
        if sender.college != receiver.college:
            raise ValueError("You can only message users within your college.")
        
        return Message.objects.create(
            sender=sender,
            receiver=receiver,
            college=sender.college,
            subject=subject,
            body=body
        )

    @staticmethod
    def create_notification(college, recipient, title, message, notification_type=NotificationType.SYSTEM):
        if college != recipient.college:
            raise ValueError("Recipient must belong to your college.")
            
        return Notification.objects.create(
            college=college,
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type
        )

    @staticmethod
    def create_feedback(student, subject, rating, comments, is_anonymous=False):
        return Feedback.objects.create(
            college=student.college,
            student=student,
            subject=subject,
            rating=rating,
            comments=comments,
            is_anonymous=is_anonymous
        )
