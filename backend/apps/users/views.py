import csv
import io
from django.db import transaction
from rest_framework.decorators import action
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

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
    def bulk_import(self, request):
        file = request.FILES.get('file')
        batch_id = request.data.get('batch_id')
        department_id = request.data.get('department_id')
        
        if not file:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.endswith('.csv'):
            return Response({"detail": "File must be a CSV."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            created_count = 0
            errors = []
            
            with transaction.atomic():
                for i, row in enumerate(reader, start=1):
                    if not all(k in row for k in ['registration_number', 'first_name', 'last_name', 'email', 'password']):
                        raise ValueError(f"Row {i} is missing required columns (registration_number, first_name, last_name, email, password).")
                        
                    data = {
                        'registration_number': row['registration_number'].strip(),
                        'first_name': row['first_name'].strip(),
                        'last_name': row['last_name'].strip(),
                        'email': row['email'].strip(),
                        'password': row['password'].strip(),
                        'role': 'STUDENT',
                        'batch_id': batch_id,
                        'department_id': department_id
                    }
                    
                    serializer = UserCreateSerializer(data=data)
                    if serializer.is_valid():
                        serializer.save(college=request.user.college)
                        created_count += 1
                    else:
                        errors.append(f"Row {i} error: {serializer.errors}")
                        
                if errors:
                    raise ValueError(errors)
                
            return Response({"detail": f"Successfully imported {created_count} students."}, status=status.HTTP_201_CREATED)
            
        except ValueError as ve:
            if isinstance(ve.args[0], list):
                return Response({"detail": "Errors during import", "errors": ve.args[0]}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
