from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubjectViewSet, EnrollmentViewSet, BatchViewSet,
    DepartmentViewSet, StudentViewSet, TeacherProfileViewSet,
    dashboard_stats
)

router = DefaultRouter()
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'teachers', TeacherProfileViewSet, basename='teacher-profile')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('dashboard-stats/', dashboard_stats, name='dashboard-stats'),
    path('', include(router.urls)),
]
