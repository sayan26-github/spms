from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClassSessionViewSet, AttendanceViewSet

router = DefaultRouter()
router.register(r'sessions', ClassSessionViewSet, basename='session')
router.register(r'records', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
]
