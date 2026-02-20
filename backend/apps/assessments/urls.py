from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssessmentViewSet, MarksViewSet

router = DefaultRouter()
router.register(r'tests', AssessmentViewSet, basename='assessment')
router.register(r'marks', MarksViewSet, basename='marks')

urlpatterns = [
    path('', include(router.urls)),
]
