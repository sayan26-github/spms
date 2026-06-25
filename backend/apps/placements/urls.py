from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompanyViewSet, JobPostingViewSet, SkillViewSet, 
    StudentSkillViewSet, JobApplicationViewSet, PlacementAnalyticsView
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'jobs', JobPostingViewSet, basename='job')
router.register(r'skills', SkillViewSet, basename='skill')
router.register(r'student-skills', StudentSkillViewSet, basename='studentskill')
router.register(r'applications', JobApplicationViewSet, basename='application')
router.register(r'analytics', PlacementAnalyticsView, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]
