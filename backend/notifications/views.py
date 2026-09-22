from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationUnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})

class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk=None):
        if pk:
            try:
                notification = Notification.objects.get(pk=pk, user=request.user)
                notification.is_read = True
                notification.save()
                return Response({'status': 'marked as read'})
            except Notification.DoesNotExist:
                return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Mark all as read
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
            return Response({'status': 'all marked as read'})
