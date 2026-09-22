from django.db.models.signals import post_save
from django.dispatch import receiver
from applications.models import Application
from documents.models import Document
from .services import trigger_status_notification

@receiver(post_save, sender=Application)
def application_post_save(sender, instance, created, **kwargs):
    if not created:
        # We can't cleanly detect previous status here unless we store it beforehand,
        # but ApplicationDetailView `perform_update` will create ApplicationHistory.
        # We'll trigger status notifications from the view or history creation instead
        # to ensure we have previous vs new status context.
        pass
    else:
        # Trigger application created notification
        from .services import create_notification
        create_notification(
            user=instance.user,
            notification_type='APPLICATION_CREATED',
            title='Application Created',
            message=f"You have started a new application for {instance.scholarship.name}.",
            related_scholarship=instance.scholarship,
            related_application=instance,
            priority='LOW',
            key=f"app_created_{instance.id}"
        )

@receiver(post_save, sender=Document)
def document_post_save(sender, instance, created, **kwargs):
    from .services import create_notification
    # When a document is verified
    if instance.status == 'VERIFIED':
        create_notification(
            user=instance.user,
            notification_type='DOCUMENT_VERIFIED',
            title='Document Verified',
            message=f"Your document '{instance.document_type}' has been verified.",
            priority='MEDIUM',
            key=f"doc_verified_{instance.id}_{instance.updated_at.strftime('%Y%m%d%H%M%S')}"
        )
    elif created:
        create_notification(
            user=instance.user,
            notification_type='DOCUMENT_UPLOADED',
            title='Document Uploaded',
            message=f"You successfully uploaded '{instance.document_type}'.",
            priority='LOW',
            key=f"doc_uploaded_{instance.id}"
        )
