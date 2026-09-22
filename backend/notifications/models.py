from django.db import models
from django.contrib.auth import get_user_model
from scholarships.models import Scholarship
from applications.models import Application

User = get_user_model()

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('NEW_SCHOLARSHIP_MATCH', 'New Scholarship Match'),
        ('APPLICATION_CREATED', 'Application Created'),
        ('APPLICATION_READY', 'Application Ready'),
        ('MISSING_DOCUMENT', 'Missing Document'),
        ('DOCUMENT_UPLOADED', 'Document Uploaded'),
        ('DOCUMENT_VERIFICATION_REQUIRED', 'Document Verification Required'),
        ('DOCUMENT_VERIFIED', 'Document Verified'),
        ('DOCUMENT_EXPIRING_SOON', 'Document Expiring Soon'),
        ('APPLICATION_STATUS_UPDATED', 'Application Status Updated'),
        ('APPLICATION_APPROVED', 'Application Approved'),
        ('APPLICATION_REJECTED', 'Application Rejected'),
        ('DEADLINE_UPCOMING', 'Deadline Upcoming'),
        ('DEADLINE_URGENT', 'Deadline Urgent'),
        ('DEADLINE_PASSED', 'Deadline Passed'),
        ('CHECKLIST_INCOMPLETE', 'Checklist Incomplete'),
        ('PROFILE_INCOMPLETE', 'Profile Incomplete'),
        ('NEW_HIGH_MATCH_SCHOLARSHIP', 'New High-Match Scholarship'),
    )
    
    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    related_scholarship = models.ForeignKey(Scholarship, on_delete=models.SET_NULL, null=True, blank=True)
    related_application = models.ForeignKey(Application, on_delete=models.SET_NULL, null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    key = models.CharField(max_length=255, null=True, blank=True, unique=True, help_text="Unique key to prevent spam")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"
