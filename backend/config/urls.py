"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from apps.academics.views import SubjectViewSet, EnrollmentViewSet, ResourceViewSet
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

from rest_framework.routers import DefaultRouter
from apps.users.views import UserViewSet
from apps.academics.views import SubjectViewSet, EnrollmentViewSet, ResourceViewSet

router = DefaultRouter()
router.register(r'auth/users', UserViewSet, basename='users')
router.register(r'academics/subjects', SubjectViewSet, basename='subjects')
router.register(r'academics/enrollments', EnrollmentViewSet, basename='enrollments')
router.register(r'academics/resources', ResourceViewSet, basename='resources')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('apps.api.urls')),
]
