from django.urls import path
from .views import LoginView, ChangePasswordView, UserProfileView, CollegeListView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('colleges/', CollegeListView.as_view(), name='college-list'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('profile/', UserProfileView.as_view(), name='profile'),
]

from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AdminManagementViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'admins', AdminManagementViewSet, basename='admin')

urlpatterns += router.urls
