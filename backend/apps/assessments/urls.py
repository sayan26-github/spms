from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssessmentViewSet, MarksViewSet, TranscriptView, MyTranscriptView, AssignmentTaskViewSet, AssignmentSubmissionViewSet

router = DefaultRouter()
router.register(r'tests', AssessmentViewSet, basename='assessment')
router.register(r'marks', MarksViewSet, basename='marks')
router.register(r'assignments', AssignmentTaskViewSet, basename='assignmenttask')
router.register(r'submissions', AssignmentSubmissionViewSet, basename='assignmentsubmission')

urlpatterns = [
    path('transcript/me/', MyTranscriptView.as_view(), name='my-transcript'),
    path('transcript/<int:student_id>/', TranscriptView.as_view(), name='student-transcript'),
    path('', include(router.urls)),
]
