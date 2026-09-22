from rest_framework import serializers
from .models import Scholarship, ScholarshipRequirement, SavedScholarship

class ScholarshipRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScholarshipRequirement
        fields = '__all__'

class ScholarshipSerializer(serializers.ModelSerializer):
    requirements = ScholarshipRequirementSerializer(read_only=True)
    
    class Meta:
        model = Scholarship
        fields = '__all__'

class SavedScholarshipSerializer(serializers.ModelSerializer):
    scholarship = ScholarshipSerializer(read_only=True)
    
    class Meta:
        model = SavedScholarship
        fields = '__all__'
        read_only_fields = ('user',)
