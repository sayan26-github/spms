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
        qs = Message.objects.select_related('sender', 'receiver').filter(college=user.college).filter(
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
        from .services import CommunicationService
        instance = CommunicationService.create_message(
            sender=self.request.user,
            receiver=serializer.validated_data['receiver'],
            subject=serializer.validated_data.get('subject', ''),
            body=serializer.validated_data.get('body', '')
        )
        serializer.instance = instance

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

    def get_permissions(self):
        if self.action == 'create':
            from apps.users.permissions import IsAdmin, IsHead
            return [permissions.IsAuthenticated(), (IsAdmin() | IsHead())]
        return super().get_permissions()

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user, recipient__college=self.request.user.college)

    def perform_create(self, serializer):
        from .services import CommunicationService
        from apps.common.constants import NotificationType
        instance = CommunicationService.create_notification(
            college=self.request.user.college,
            recipient=serializer.validated_data.get('recipient'),
            title=serializer.validated_data.get('title'),
            message=serializer.validated_data.get('message'),
            notification_type=serializer.validated_data.get('notification_type', NotificationType.SYSTEM)
        )
        serializer.instance = instance

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
        from .services import CommunicationService
        instance = CommunicationService.create_feedback(
            student=self.request.user,
            subject=serializer.validated_data.get('subject'),
            rating=serializer.validated_data.get('rating'),
            comments=serializer.validated_data.get('comments', ''),
            is_anonymous=serializer.validated_data.get('is_anonymous', False)
        )
        serializer.instance = instance
