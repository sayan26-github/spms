from rest_framework import views, status, permissions, generics, viewsets
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils.translation import gettext_lazy as _

from .serializers import (
    LoginSerializer, UserSerializer, ChangePasswordSerializer,
    UserCreateSerializer, CollegeRegistrationSerializer
)
from .services import AuthService, CollegeRegistrationService
from .models import User
from .permissions import IsAdmin, IsHead
from apps.academics.models import College


class CollegeListView(views.APIView):
    """Public endpoint returning colleges for the login page selector."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        colleges = College.objects.values('id', 'name', 'code').order_by('name')
        return Response(list(colleges))


class CollegeRegistrationView(views.APIView):
    """Public endpoint to register a new college with its first admin."""
    permission_classes = [permissions.AllowAny]
    serializer_class = CollegeRegistrationSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            college, admin_user = (
                CollegeRegistrationService.register_college_with_admin(
                    serializer.validated_data
                )
            )
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                'detail': 'College registered successfully.',
                'college': {
                    'id': college.id,
                    'name': college.name,
                    'code': college.code,
                },
                'admin_username': admin_user.username,
            },
            status=status.HTTP_201_CREATED
        )

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        registration_number = serializer.validated_data['registration_number']
        password = serializer.validated_data['password']
        college_code = serializer.validated_data.get('college_code')

        try:
            user = AuthService.authenticate_user(registration_number, password, college_code)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if user:
            tokens = AuthService.get_tokens_for_user(user)
            return Response(tokens, status=status.HTTP_200_OK)
        
        return Response({"detail": _("Invalid credentials")}, status=status.HTTP_401_UNAUTHORIZED)

class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        success, message = AuthService.change_password(
            request.user, 
            serializer.validated_data['old_password'], 
            serializer.validated_data['new_password']
        )

        if success:
            return Response({"detail": message}, status=status.HTTP_200_OK)
        return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

class UserViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing users (Students, Teachers).
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHead]

    def get_queryset(self):
        # Admins/Heads see users from their college
        # Admins/Heads see users from their college
        return User.objects.filter(college=self.request.user.college)

    def perform_create(self, serializer):
        # Auto-assign the admin's college to the new user
        serializer.save(college=self.request.user.college)

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

from rest_framework import mixins

class AdminManagementViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    ViewSet specifically for managing other Admins.
    Allows listing and creating admins within the same college.
    Does not allow updating or deleting admins.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        return User.objects.filter(college=self.request.user.college, role='ADMIN')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        # Force the role to ADMIN irrespective of user input, 
        # and assign the current admin's college.
        serializer.save(college=self.request.user.college, role='ADMIN')
