from rest_framework import serializers
from datetime import date
from .models import Application, ApplicationChecklist, ApplicationHistory
from scholarships.serializers import ScholarshipSerializer
from scholarships.models import Scholarship
from accounts.models import StudentProfile
from documents.models import Document
from ai_engine.matching import calculate_match_score

class ApplicationChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationChecklist
        fields = ['id', 'item_name', 'is_completed']

class ApplicationHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    
    class Meta:
        model = ApplicationHistory
        fields = ['id', 'previous_status', 'new_status', 'changed_at', 'changed_by_name']

class ApplicationSerializer(serializers.ModelSerializer):
    checklists = ApplicationChecklistSerializer(many=True, read_only=True)
    scholarship_details = ScholarshipSerializer(source='scholarship', read_only=True)
    history = ApplicationHistorySerializer(many=True, read_only=True)

    match_score = serializers.SerializerMethodField()
    eligibility_status = serializers.SerializerMethodField()
    matched_criteria = serializers.SerializerMethodField()
    unmet_criteria = serializers.SerializerMethodField()
    missing_information = serializers.SerializerMethodField()
    required_documents = serializers.SerializerMethodField()
    uploaded_documents = serializers.SerializerMethodField()
    missing_documents = serializers.SerializerMethodField()
    document_readiness = serializers.SerializerMethodField()
    blockers = serializers.SerializerMethodField()
    acceptance_improvements = serializers.SerializerMethodField()
    next_action = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    deadline_priority = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'scholarship', 'scholarship_details', 'status', 'progress',
            'created_at', 'updated_at', 'checklists', 'history',
            'match_score', 'eligibility_status', 'matched_criteria', 'unmet_criteria', 'missing_information',
            'required_documents', 'uploaded_documents', 'missing_documents',
            'document_readiness', 'blockers', 'acceptance_improvements',
            'next_action', 'days_remaining', 'deadline_priority'
        ]
        read_only_fields = ['progress', 'created_at', 'updated_at']

    def _get_analysis(self, obj):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else obj.user

        try:
            profile = user.profile
        except (AttributeError, StudentProfile.DoesNotExist):
            profile = None

        if profile:
            score, details = calculate_match_score(profile, obj.scholarship)
        else:
            score = 70
            details = {
                'category_scores': {},
                'eligibility_percentage': 70,
                'eligibility_status': 'NEEDS_VERIFICATION',
                'matched_criteria': ['Base criteria matched'],
                'missing_information': ['Profile incomplete'],
                'unmet_criteria': []
            }

        # Parse required documents
        req_docs = []
        if hasattr(obj.scholarship, 'requirements') and obj.scholarship.requirements and obj.scholarship.requirements.required_documents:
            req_docs = [d.strip() for d in obj.scholarship.requirements.required_documents.split(',') if d.strip()]

        # Query user uploaded documents
        user_docs_qs = Document.objects.filter(user=user)
        uploaded_doc_map = {d.document_type: d for d in user_docs_qs}

        uploaded_list = []
        missing_list = []
        verified_count = 0

        for r_doc in req_docs:
            if r_doc in uploaded_doc_map:
                doc_obj = uploaded_doc_map[r_doc]
                uploaded_list.append({
                    'document_type': r_doc,
                    'status': doc_obj.status,
                    'is_verified': doc_obj.status == 'VERIFIED'
                })
                if doc_obj.status == 'VERIFIED':
                    verified_count += 1
            else:
                missing_list.append(r_doc)

        doc_readiness = 100
        if req_docs:
            doc_readiness = int((verified_count / len(req_docs)) * 100)

        # Blockers
        blockers = []
        if missing_list:
            blockers.append(f"{len(missing_list)} required document(s) missing ({', '.join(missing_list)})")
        
        unverified = [d['document_type'] for d in uploaded_list if not d['is_verified']]
        if unverified:
            blockers.append(f"{len(unverified)} uploaded document(s) pending verification ({', '.join(unverified)})")

        if details.get('unmet_criteria'):
            for g in details['unmet_criteria']:
                blockers.append(g)

        today = date.today()
        days_rem = (obj.scholarship.deadline - today).days if obj.scholarship.deadline else 999
        if days_rem < 0:
            blockers.append("Scholarship deadline has passed")

        # Improvements
        improvements = []
        if missing_list:
            improvements.append(f"Upload missing document(s): {', '.join(missing_list)} to complete documentation.")
        if unverified:
            improvements.append(f"Verify uploaded document(s): {', '.join(unverified)} to resolve verification uncertainty.")
        if profile and (profile.cgpa is None or profile.annual_family_income is None):
            improvements.append("Complete academic and financial details in Profile to increase match confidence.")
        if obj.checklists.filter(is_completed=False).exists():
            improvements.append("Complete all remaining checklist items before final submission.")

        # Next Action
        if missing_list:
            next_action = f"Upload {missing_list[0]}"
        elif unverified:
            next_action = f"Verify {unverified[0]}"
        elif obj.checklists.filter(is_completed=False).exists():
            next_action = "Complete checklist items"
        elif obj.status in ['DISCOVERED', 'SAVED', 'PREPARING']:
            next_action = "Submit application on official portal"
        else:
            next_action = "Application submitted — track status"

        # Deadline Priority
        if days_rem <= 7:
            priority = 'HIGH'
        elif days_rem <= 30:
            priority = 'MEDIUM'
        else:
            priority = 'LOW'

        return {
            'score': score,
            'details': details,
            'req_docs': req_docs,
            'uploaded_docs': uploaded_list,
            'missing_docs': missing_list,
            'doc_readiness': doc_readiness,
            'blockers': blockers,
            'improvements': improvements,
            'next_action': next_action,
            'days_remaining': days_rem,
            'deadline_priority': priority
        }

    def get_match_score(self, obj):
        return self._get_analysis(obj)['score']

    def get_eligibility_status(self, obj):
        return self._get_analysis(obj)['details'].get('eligibility_status', 'ELIGIBLE')

    def get_matched_criteria(self, obj):
        return self._get_analysis(obj)['details'].get('matched_criteria', [])

    def get_unmet_criteria(self, obj):
        return self._get_analysis(obj)['details'].get('unmet_criteria', [])

    def get_missing_information(self, obj):
        return self._get_analysis(obj)['details'].get('missing_information', [])

    def get_required_documents(self, obj):
        return self._get_analysis(obj)['req_docs']

    def get_uploaded_documents(self, obj):
        return self._get_analysis(obj)['uploaded_docs']

    def get_missing_documents(self, obj):
        return self._get_analysis(obj)['missing_docs']

    def get_document_readiness(self, obj):
        return self._get_analysis(obj)['doc_readiness']

    def get_blockers(self, obj):
        return self._get_analysis(obj)['blockers']

    def get_acceptance_improvements(self, obj):
        return self._get_analysis(obj)['improvements']

    def get_next_action(self, obj):
        return self._get_analysis(obj)['next_action']

    def get_days_remaining(self, obj):
        return self._get_analysis(obj)['days_remaining']

    def get_deadline_priority(self, obj):
        return self._get_analysis(obj)['deadline_priority']

