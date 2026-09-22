from django.contrib import admin
from .models import Scholarship, ScholarshipRequirement, SavedScholarship

admin.site.register(Scholarship)
admin.site.register(ScholarshipRequirement)
admin.site.register(SavedScholarship)
