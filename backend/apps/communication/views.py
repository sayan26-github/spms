from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Message, Notification, Feedback
from .serializers import MessageSerializer, NotificationSerializer, FeedbackSerializer
from apps.users.models import User
from apps.users.serializers import UserSerializer
from apps.common.constants import UserRole

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['subject', 'body', 'sender__first_name', 'sender__last_name', 'receiver__first_name', 'receiver__last_name']

    def get_queryset(self):
        user = self.request.user
        # Base queryset: messages belonging to user's college
        # Filter: either sender is user OR receiver is user
        qs = Message.objects.filter(college=user.college).filter(
            Q(sender=user) | Q(receiver=user)
        )
        
        
        # Apply folder filter only for list action
        if self.action == 'list':
            folder = self.request.query_params.get('folder', 'inbox')
            if folder == 'sent':
                qs = qs.filter(sender=user)
            else:
                qs = qs.filter(receiver=user)
                
        return qs

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user, college=self.request.user.college)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Mark as read if user is receiver
        if instance.receiver == request.user and not instance.is_read:
            instance.is_read = True
            instance.save()
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def users(self, request):
        """
        List users in the same college for composing messages.
        Exclude the current user.
        """
        user = request.user
        users = User.objects.filter(college=user.college).exclude(id=user.id)
        
        # Optional: Filter by role if needed, e.g. ?role=TEACHER
        role = request.query_params.get('role')
        if role:
            users = users.filter(role=role)
            
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete'] # POST needed for actions, even if create is disabled via permissions if needed

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked as read'})

class FeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.HEAD]:
            return Feedback.objects.filter(college=user.college)
        elif user.role == UserRole.TEACHER:
            # Teachers see feedback for subjects they teach
            return Feedback.objects.filter(
                college=user.college, subject__teacher__user=user
            )
        else:
            # Students see their own feedback
            return Feedback.objects.filter(student=user, college=user.college)

    def perform_create(self, serializer):
        serializer.save(
            student=self.request.user,
            college=self.request.user.college
        )
