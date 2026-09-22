from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from applications.models import Application
from notifications.models import Notification
from applications.serializers import ApplicationSerializer
from notifications.serializers import NotificationSerializer
from django.db.models import Sum
from datetime import date

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Portfolio / General Stats
        apps = Application.objects.filter(user=user)
        total_apps = apps.count()
        preparing = apps.filter(status__in=['SAVED', 'PREPARING']).count()
        applied = apps.filter(status__in=['APPLIED', 'UNDER_REVIEW']).count()
        approved = apps.filter(status='APPROVED').count()
        rejected = apps.filter(status='REJECTED').count()
        
        # Calculate funding
        # Potential: any active app not rejected
        potential_funding = apps.exclude(status='REJECTED').aggregate(total=Sum('scholarship__amount'))['total'] or 0
        # Successful: approved
        successful_funding = apps.filter(status='APPROVED').aggregate(total=Sum('scholarship__amount'))['total'] or 0

        # Recent Notifications (top 5 unread or recent)
        recent_notifications = Notification.objects.filter(user=user).order_by('-created_at')[:5]
        
        # Applications Needing Action
        # We can leverage the serializer to calculate dynamic blockers/next action
        urgent_apps = []
        for app in apps:
            app_data = ApplicationSerializer(app, context={'request': request}).data
            
            # Determine if it needs action: Missing docs, urgent deadline, or incomplete checklist
            has_missing = len(app_data.get('missing_documents', [])) > 0
            is_urgent_deadline = app_data.get('deadline_priority') in ['HIGH', 'URGENT']
            is_incomplete = app_data.get('progress', 0) < 100
            
            if (has_missing or is_urgent_deadline) and app.status in ['PREPARING', 'SAVED', 'DISCOVERED']:
                urgent_apps.append(app_data)
        
        # Sort urgent apps by deadline priority
        urgent_apps.sort(key=lambda x: x.get('days_remaining', 999))

        return Response({
            'stats': {
                'total_applications': total_apps,
                'preparing': preparing,
                'applied': applied,
                'approved': approved,
                'rejected': rejected,
                'potential_funding': potential_funding,
                'successful_funding': successful_funding
            },
            'recent_notifications': NotificationSerializer(recent_notifications, many=True).data,
            'applications_needing_action': urgent_apps[:3] # Top 3
        })
