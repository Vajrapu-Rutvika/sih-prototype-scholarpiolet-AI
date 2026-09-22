from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Scholarship(models.fields.related.OneToOneField):
    pass

class Scholarship(models.Model):
    name = models.CharField(max_length=255)
    provider = models.CharField(max_length=255)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    deadline = models.DateField()
    application_url = models.URLField(max_length=500, null=True, blank=True)
    
    # Base Categorization
    category = models.CharField(max_length=100, null=True, blank=True)
    scholarship_type = models.CharField(max_length=100, null=True, blank=True) # Merit, Need-based, Government, etc.
    provider_type = models.CharField(max_length=100, null=True, blank=True)
    official_source = models.BooleanField(default=True)
    
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ScholarshipRequirement(models.Model):
    scholarship = models.OneToOneField(Scholarship, on_delete=models.CASCADE, related_name='requirements')
    
    # Eligibility criteria
    course = models.CharField(max_length=255, null=True, blank=True) # JSON or comma separated
    education_level = models.CharField(max_length=100, null=True, blank=True)
    min_cgpa = models.FloatField(null=True, blank=True)
    max_income = models.FloatField(null=True, blank=True)
    gender_eligibility = models.CharField(max_length=50, null=True, blank=True) # All, Female, Male
    state_eligibility = models.CharField(max_length=255, null=True, blank=True) # comma separated
    category_eligibility = models.CharField(max_length=255, null=True, blank=True) # comma separated
    
    # Document requirements (comma separated list of document types)
    required_documents = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Requirements for {self.scholarship.name}"

class SavedScholarship(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_scholarships')
    scholarship = models.ForeignKey(Scholarship, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'scholarship')

    def __str__(self):
        return f"{self.user.username} saved {self.scholarship.name}"
