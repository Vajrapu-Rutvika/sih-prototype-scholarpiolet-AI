from django.db import models
from django.contrib.auth import get_user_model
from scholarships.models import Scholarship

User = get_user_model()

class Application(models.Model):
    STATUS_CHOICES = (
        ('DISCOVERED', 'Discovered'),
        ('SAVED', 'Saved'),
        ('PREPARING', 'Preparing'),
        ('APPLIED', 'Applied'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    scholarship = models.ForeignKey(Scholarship, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PREPARING')
    progress = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_progress(self):
        checklists = self.checklists.all()
        if not checklists.exists():
            return 0
        completed = checklists.filter(is_completed=True).count()
        return int((completed / checklists.count()) * 100)

    def save(self, *args, **kwargs):
        if self.pk:
            self.progress = self.calculate_progress()
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('user', 'scholarship')

    def __str__(self):
        return f"{self.user.username} - {self.scholarship.name} - {self.status}"

class ApplicationHistory(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='history')
    previous_status = models.CharField(max_length=20, choices=Application.STATUS_CHOICES, null=True, blank=True)
    new_status = models.CharField(max_length=20, choices=Application.STATUS_CHOICES)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.application.scholarship.name} - {self.previous_status} -> {self.new_status}"

class ApplicationChecklist(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='checklists')
    item_name = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.item_name} for {self.application.scholarship.name}"
