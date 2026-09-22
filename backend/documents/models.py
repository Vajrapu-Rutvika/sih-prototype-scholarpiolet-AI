from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Document(models.Model):
    DOCUMENT_TYPES = (
        ('ID_PROOF', 'Personal/Identity'),
        ('COLLEGE_ID', 'College ID'),
        ('BONAFIDE', 'Bonafide'),
        ('INCOME_CERT', 'Income Certificate'),
        ('CASTE_CERT', 'Caste/Category Certificate'),
        ('MARKSHEET', 'Marksheet/Academic'),
        ('FEE_RECEIPT', 'Fee Receipt'),
        ('BANK_DOC', 'Bank Document'),
        ('DOMICILE_CERT', 'Domicile'),
        ('DISABILITY_CERT', 'Disability Certificate'),
        ('OTHER', 'Other'),
    )
    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('MISSING', 'Missing'),
        ('EXPIRED', 'Expired'),
        ('VERIFICATION_REQUIRED', 'Verification Required'),
        ('VERIFIED', 'Verified'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='documents/%Y/%m/%d/', null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='AVAILABLE')
    
    # Raw OCR Storage & Extracted Info
    raw_ocr_text = models.TextField(null=True, blank=True)
    confidence = models.FloatField(null=True, blank=True)
    
    extracted_name = models.CharField(max_length=255, null=True, blank=True)
    extracted_dob = models.DateField(null=True, blank=True)
    extracted_id_number = models.CharField(max_length=100, null=True, blank=True)
    extracted_income = models.FloatField(null=True, blank=True)
    extracted_institution = models.CharField(max_length=255, null=True, blank=True)
    extracted_marks = models.CharField(max_length=100, null=True, blank=True)
    extracted_category = models.CharField(max_length=100, null=True, blank=True)
    extracted_address = models.TextField(null=True, blank=True)
    
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_document_type_display()}"
