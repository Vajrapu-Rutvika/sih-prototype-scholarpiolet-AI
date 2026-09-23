from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['user', 'uploaded_at', 'updated_at', 'status', 'file_base64']

    def validate_file(self, value):
        if not value:
            raise serializers.ValidationError("File is required.")
            
        # Validate file size (e.g., 5MB limit)
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size must be under 5MB.")
            
        # Validate file type
        valid_types = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
        if value.content_type not in valid_types:
            raise serializers.ValidationError("Unsupported file type. Please upload a JPG, PNG, or PDF.")
            
        return value

class DocumentVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            'extracted_name', 'extracted_dob', 'extracted_id_number',
            'extracted_income', 'extracted_institution', 'extracted_marks',
            'extracted_category', 'extracted_address', 'issue_date', 'expiry_date', 'status'
        ]
