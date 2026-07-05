from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITransactionTestCase
from apps.users.models import User
from apps.academics.models import College, Subject, Student
from apps.communication.models import Notification, Feedback
from apps.common.constants import UserRole, NotificationType

class NotificationFeedbackTests(APITransactionTestCase):
    reset_sequences = True

    def setUp(self):
        # Create College
        self.college = College.objects.create(name="Test College", code="TC1", contact_email="test@test.com")
        
        # Create Users
        self.student_user = User.objects.create_user(
            email="student@test.com", 
            password="password123", 
            role=UserRole.STUDENT,
            college=self.college,
            registration_number="REG001",
            first_name="Student",
            last_name="One"
        )
        self.teacher_user = User.objects.create_user(
            email="teacher@test.com", 
            password="password123", 
            role=UserRole.TEACHER,
            college=self.college,
            registration_number="TCH001",
            first_name="Teacher",
            last_name="One"
        )
        
        # Create Subject
        self.subject = Subject.objects.create(
            name="Mathematics", 
            code="MATH101", 
            semester=1, 
            college=self.college
        )
        
        # Create Notification for Student
        self.notification = Notification.objects.create(
            recipient=self.student_user,
            title="Welcome",
            message="Welcome to the portal",
            notification_type=NotificationType.SYSTEM
        )

    # TearDown removed as APITransactionTestCase handles cleanup

    def test_get_notifications(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('notification-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', response.data)), 1)
        res_data = response.data.get('results', response.data)
        self.assertEqual(res_data[0]['title'], "Welcome")

    def test_mark_notification_read(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('notification-mark-read', args=[self.notification.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_create_feedback_anonymous(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('feedback-list')
        data = {
            'subject': self.subject.id,
            'rating': 5,
            'comments': "Great course!",
            'is_anonymous': True
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        feedback = Feedback.objects.get(id=response.data['id'])
        self.assertTrue(feedback.is_anonymous)
        self.assertEqual(feedback.student, self.student_user) # Database should still link user

    def test_get_feedback_anonymity(self):
        # Create anonymous feedback
        Feedback.objects.create(
            student=self.student_user,
            subject=self.subject,
            rating=4,
            comments="Good",
            is_anonymous=True,
            college=self.college
        )
        
        self.client.force_authenticate(user=self.student_user)
        url = reverse('feedback-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.data.get('results', response.data)
        self.assertEqual(res_data[0]['student_name'], "Anonymous")

    def test_get_feedback_named(self):
        # Create named feedback
        Feedback.objects.create(
            student=self.student_user,
            subject=self.subject,
            rating=4,
            comments="Good",
            is_anonymous=False,
            college=self.college
        )
        
        self.client.force_authenticate(user=self.student_user)
        url = reverse('feedback-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.data.get('results', response.data)
        self.assertEqual(res_data[0]['student_name'], "Student One")
