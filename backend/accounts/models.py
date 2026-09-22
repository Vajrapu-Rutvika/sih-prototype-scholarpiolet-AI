from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Additional fields if necessary, e.g., role
    ROLE_CHOICES = (
        ('STUDENT', 'Student'),
        ('ADMIN', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    
    def __str__(self):
        return self.username

class StudentProfile(models.fields.related.OneToOneField):
    # Will use standard OneToOneField
    pass

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Personal Info
    full_name = models.CharField(max_length=255, null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    district = models.CharField(max_length=100, null=True, blank=True)
    category = models.CharField(max_length=50, null=True, blank=True) # General, OBC, SC, ST, etc.
    is_disabled = models.BooleanField(default=False)
    
    # Academic Info (College)
    institution = models.CharField(max_length=255, null=True, blank=True)
    university = models.CharField(max_length=255, null=True, blank=True)
    course = models.CharField(max_length=100, null=True, blank=True)
    branch = models.CharField(max_length=100, null=True, blank=True)
    year = models.IntegerField(null=True, blank=True) # 1, 2, 3, 4
    semester = models.IntegerField(null=True, blank=True)
    student_id = models.CharField(max_length=100, null=True, blank=True)
    
    # Academic Info (Grades)
    cgpa = models.FloatField(null=True, blank=True)
    percentage = models.FloatField(null=True, blank=True)
    tenth_details = models.TextField(null=True, blank=True)
    twelfth_details = models.TextField(null=True, blank=True)
    
    # Financial & Category Cert Info
    annual_family_income = models.FloatField(null=True, blank=True)
    income_certificate_status = models.CharField(max_length=50, default='NOT_UPLOADED')
    category_certificate_info = models.TextField(null=True, blank=True)
    
    # Skills & Achievements (Stored as JSON or comma separated)
    technical_skills = models.TextField(null=True, blank=True)
    certifications = models.TextField(null=True, blank=True)
    achievements = models.TextField(null=True, blank=True)
    extracurricular = models.TextField(null=True, blank=True)

    def calculate_profile_completion(self):
        fields = [
            'full_name', 'dob', 'gender', 'address', 'state', 'district', 'category',
            'institution', 'university', 'course', 'branch', 'year', 'student_id',
            'cgpa', 'tenth_details', 'twelfth_details', 'annual_family_income'
        ]
        filled = sum(1 for field in fields if getattr(self, field) not in [None, ''])
        return int((filled / len(fields)) * 100)

    def __str__(self):
        return f"{self.user.username}'s Profile"
