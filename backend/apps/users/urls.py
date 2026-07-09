from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, ChangePasswordView, UserProfileView, CollegeListView, CollegeRegistrationView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('colleges/', CollegeListView.as_view(), name='college-list'),
    path('register-college/', CollegeRegistrationView.as_view(), name='register-college'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('profile/', UserProfileView.as_view(), name='profile'),
]

from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AdminManagementViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'admins', AdminManagementViewSet, basename='admin')

urlpatterns += router.urls
