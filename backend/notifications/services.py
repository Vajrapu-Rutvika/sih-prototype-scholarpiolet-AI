from .models import Notification

def create_notification(user, notification_type, title, message, related_scholarship=None, related_application=None, priority='MEDIUM', key=None):
    """
    Safely creates a notification. If a key is provided, it prevents duplicates.
    """
    if key:
        notification, created = Notification.objects.get_or_create(
            key=key,
            defaults={
                'user': user,
                'notification_type': notification_type,
                'title': title,
                'message': message,
                'related_scholarship': related_scholarship,
                'related_application': related_application,
                'priority': priority
            }
        )
        return notification
    else:
        return Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            related_scholarship=related_scholarship,
            related_application=related_application,
            priority=priority
        )

def trigger_status_notification(application):
    status_display = dict(application.STATUS_CHOICES).get(application.status, application.status)
    title = "Application Status Updated"
    message = f"Your {application.scholarship.name} application has been updated to {status_display}."
    priority = 'HIGH' if application.status in ['APPROVED', 'REJECTED'] else 'MEDIUM'
    
    key = f"status_{application.id}_{application.status}"
    
    create_notification(
        user=application.user,
        notification_type='APPLICATION_STATUS_UPDATED',
        title=title,
        message=message,
        related_scholarship=application.scholarship,
        related_application=application,
        priority=priority,
        key=key
    )

def trigger_missing_document_notification(application, document_name):
    key = f"missing_doc_{application.id}_{document_name.replace(' ', '_')}"
    create_notification(
        user=application.user,
        notification_type='MISSING_DOCUMENT',
        title='Missing Document',
        message=f"Your {application.scholarship.name} application is missing: {document_name}.",
        related_scholarship=application.scholarship,
        related_application=application,
        priority='HIGH',
        key=key
    )
