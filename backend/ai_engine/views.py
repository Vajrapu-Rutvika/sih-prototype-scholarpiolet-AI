from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import date
from scholarships.models import Scholarship, SavedScholarship
from accounts.models import StudentProfile
from applications.models import Application
from documents.models import Document
from notifications.models import Notification
from .matching import calculate_match_score

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_eligibility(request, scholarship_id):
    scholarship = get_object_or_404(Scholarship, id=scholarship_id)
    try:
        profile = request.user.profile
    except StudentProfile.DoesNotExist:
        return Response({'error': 'Student profile not found. Please complete your profile.'}, status=400)
        
    score, details = calculate_match_score(profile, scholarship)
    return Response({
        'scholarship_id': scholarship.id,
        'scholarship_name': scholarship.name,
        'match_score': score,
        'details': details,
        'is_eligible': details.get('eligibility_status') == 'ELIGIBLE'
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_matched_scholarships(request):
    try:
        profile = request.user.profile
    except StudentProfile.DoesNotExist:
        return Response({'error': 'Student profile not found.'}, status=400)
        
    search = request.query_params.get('search', '').strip().lower()
    eligibility_filter = request.query_params.get('eligibility', 'ALL') # ALL, ELIGIBLE, NEEDS_VERIFICATION, NOT_ELIGIBLE
    category_filter = request.query_params.get('category', 'ALL') # ALL, Government, Private, Merit, Need-based, Women, State, National, Engineering, CSE, Category
    amount_sort = request.query_params.get('amount_order', 'ANY') # ANY, HIGH_TO_LOW, LOW_TO_HIGH
    sort_by = request.query_params.get('sort_by', 'best_match') # best_match, highest_chance, highest_match, highest_amount, lowest_amount, closing_soon, deadline_latest
    
    scholarships = Scholarship.objects.all()
    results = []
    
    # Calculate user document readiness and saved scholarships
    user_docs = set(Document.objects.filter(user=request.user, status='VERIFIED').values_list('document_type', flat=True))
    saved_ids = set(SavedScholarship.objects.filter(user=request.user).values_list('scholarship_id', flat=True))
    
    for scholarship in scholarships:
        # Search query check
        if search and not (
            search in scholarship.name.lower() or 
            search in scholarship.provider.lower() or 
            (scholarship.category and search in scholarship.category.lower()) or
            (scholarship.scholarship_type and search in scholarship.scholarship_type.lower())
        ):
            continue
            
        # Category / Type filter check
        if category_filter != 'ALL':
            cat_lower = category_filter.lower()
            s_cat = (scholarship.category or '').lower()
            s_type = (scholarship.scholarship_type or '').lower()
            s_prov = (scholarship.provider_type or '').lower()
            s_desc = (scholarship.description or '').lower()
            s_name = scholarship.name.lower()

            matches_cat = (
                cat_lower in s_cat or
                cat_lower in s_type or
                cat_lower in s_prov or
                cat_lower in s_name or
                cat_lower in s_desc
            )
            if not matches_cat:
                continue

        score, details = calculate_match_score(profile, scholarship)
        status = details.get('eligibility_status', 'ELIGIBLE')
        
        if eligibility_filter == 'ELIGIBLE' and status != 'ELIGIBLE':
            continue
        if eligibility_filter == 'NEEDS_VERIFICATION' and status != 'NEEDS_VERIFICATION':
            continue
        if eligibility_filter == 'NOT_ELIGIBLE' and status != 'NOT_ELIGIBLE':
            continue

        # Calculate document readiness for this specific scholarship
        req_docs = []
        if hasattr(scholarship, 'requirements') and scholarship.requirements and scholarship.requirements.required_documents:
            req_docs = [d.strip() for d in scholarship.requirements.required_documents.split(',') if d.strip()]
        
        doc_readiness = 100
        if req_docs:
            matched_docs = [d for d in req_docs if d in user_docs]
            doc_readiness = int((len(matched_docs) / len(req_docs)) * 100)

        # Days remaining
        today = date.today()
        days_remaining = (scholarship.deadline - today).days if scholarship.deadline else 999

        results.append({
            'scholarship_id': scholarship.id,
            'scholarship_name': scholarship.name,
            'provider': scholarship.provider,
            'category': scholarship.category or 'General',
            'scholarship_type': scholarship.scholarship_type or 'General',
            'amount': f"₹{scholarship.amount:,.0f}" if scholarship.amount else 'Variable',
            'amount_numeric': float(scholarship.amount) if scholarship.amount else 0,
            'deadline': scholarship.deadline.strftime('%Y-%m-%d') if scholarship.deadline else 'Deadline not verified — please check the official source',
            'days_remaining': days_remaining,
            'match_score': score,
            'eligibility_percentage': details.get('eligibility_percentage', 100),
            'eligibility_status': status,
            'doc_readiness': doc_readiness,
            'is_saved': scholarship.id in saved_ids,
            'details': details
        })

    # Sorting logic
    if sort_by == 'highest_chance':
        def chance_key(x):
            status_score = 2 if x['eligibility_status'] == 'ELIGIBLE' else (1 if x['eligibility_status'] == 'NEEDS_VERIFICATION' else 0)
            return (status_score, x['eligibility_percentage'], x['match_score'], x['doc_readiness'])
        results.sort(key=chance_key, reverse=True)
    elif sort_by == 'highest_amount' or amount_sort == 'HIGH_TO_LOW':
        results.sort(key=lambda x: x['amount_numeric'], reverse=True)
    elif sort_by == 'lowest_amount' or amount_sort == 'LOW_TO_HIGH':
        results.sort(key=lambda x: x['amount_numeric'])
    elif sort_by == 'closing_soon' or sort_by == 'deadline_soonest':
        results.sort(key=lambda x: x['days_remaining'])
    elif sort_by == 'deadline_latest':
        results.sort(key=lambda x: x['days_remaining'], reverse=True)
    elif sort_by == 'recently_added':
        results.sort(key=lambda x: x['scholarship_id'], reverse=True)
    else: # best_match / default
        results.sort(key=lambda x: x['match_score'], reverse=True)

    return Response({'matches': results})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommendations(request):
    """
    Returns top recommendations based on match score, document readiness, and deadline proximity.
    """
    user = request.user
    try:
        profile = user.profile
    except StudentProfile.DoesNotExist:
        return Response({'error': 'Profile missing'}, status=400)

    user_docs = set(Document.objects.filter(user=user, status='VERIFIED').values_list('document_type', flat=True))
    scholarships = Scholarship.objects.all()
    recs = []

    for s in scholarships:
        score, details = calculate_match_score(profile, s)
        status = details.get('eligibility_status', 'ELIGIBLE')
        
        req_docs = []
        if hasattr(s, 'requirements') and s.requirements and s.requirements.required_documents:
            req_docs = [d.strip() for d in s.requirements.required_documents.split(',') if d.strip()]
        
        doc_readiness = 100
        if req_docs:
            matched_docs = [d for d in req_docs if d in user_docs]
            doc_readiness = int((len(matched_docs) / len(req_docs)) * 100)

        today = date.today()
        days_rem = (s.deadline - today).days if s.deadline else 999

        recs.append({
            'scholarship_id': s.id,
            'scholarship_name': s.name,
            'provider': s.provider,
            'amount': f"₹{s.amount:,.0f}" if s.amount else 'Variable',
            'deadline': s.deadline.strftime('%Y-%m-%d') if s.deadline else 'Open',
            'days_remaining': days_rem,
            'match_score': score,
            'eligibility_percentage': details.get('eligibility_percentage', 100),
            'eligibility_status': status,
            'doc_readiness': doc_readiness
        })

    # Filter out ineligible and sort by match score
    recs = [r for r in recs if r['eligibility_status'] != 'NOT_ELIGIBLE']
    recs.sort(key=lambda x: (x['match_score'], x['doc_readiness']), reverse=True)

    # Automatically generate notification if a new high match scholarship is found (>=80%)
    top = recs[0] if recs else None
    if top and top['match_score'] >= 80:
        Notification.objects.get_or_create(
            user=user,
            notification_type='NEW_MATCH',
            title=f"New Scholarship Match: {top['scholarship_name']}",
            defaults={
                'message': f"You have a {top['match_score']}% match for {top['scholarship_name']}! Deadline: {top['deadline']}."
            }
        )

    return Response({'recommendations': recs[:5]})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def copilot_chat(request):
    query = request.data.get('query', '').lower()
    page_context = request.data.get('page_context', 'Dashboard')
    scholarship_id = request.data.get('scholarship_id')
    user = request.user

    action = None
    responses = []

    # Fetch live user data
    try:
        profile = user.profile
        comp = profile.calculate_profile_completion()
    except StudentProfile.DoesNotExist:
        profile = None
        comp = 0

    docs = Document.objects.filter(user=user)
    apps = Application.objects.filter(user=user)
    
    # Keyword checking
    wants_profile = any(k in query for k in ['profile', 'college', 'academic', 'income', 'category'])
    wants_docs = any(k in query for k in ['ocr', 'extracted', 'certificate', 'document', 'readiness', 'checklist'])
    wants_scholarships = any(k in query for k in ['eligible', 'match', 'scholarship', 'recommend', 'saved'])
    wants_apps = any(k in query for k in ['deadline', 'next', 'apply', 'application', 'status', 'improve', 'chance'])
    wants_urgent = any(k in query for k in ['today', 'urgent', 'attention', 'priority', 'notification'])

    if wants_urgent:
        urgent_notifications = Notification.objects.filter(user=user, is_read=False, priority__in=['HIGH', 'URGENT']).order_by('-created_at')[:3]
        if urgent_notifications:
            responses.append("Yes. You have urgent items needing attention:")
            for n in urgent_notifications:
                responses.append(f"- {n.title}: {n.message}")
        else:
            responses.append("You have no unread urgent notifications.")
            
        # Also look for high priority applications
        if apps.exists():
            urgent_found = False
            for app in apps:
                today_date = date.today()
                days_rem = (app.scholarship.deadline - today_date).days if app.scholarship.deadline else 999
                if days_rem <= 7 and app.status in ['PREPARING', 'SAVED', 'DISCOVERED']:
                    if not urgent_found:
                        responses.append("Your highest-priority action today is:")
                        urgent_found = True
                    responses.append(f"**{app.scholarship.name}** (Deadline in {days_rem} days).")
                    
                    # Find what to do for this app
                    req_docs = []
                    if hasattr(app.scholarship, 'requirements') and app.scholarship.requirements.required_documents:
                        req_docs = [d.strip() for d in app.scholarship.requirements.required_documents.split(',') if d.strip()]
                    uploaded_types = set(docs.values_list('document_type', flat=True))
                    missing_for_app = [d for d in req_docs if d not in uploaded_types]
                    
                    if missing_for_app:
                        responses.append(f"Recommended action: Upload missing document(s) ({', '.join(missing_for_app)}).")
                    elif app.checklists.filter(is_completed=False).exists():
                        responses.append("Recommended action: Complete your application checklist.")
                    else:
                        responses.append("Recommended action: Submit your application on the official portal.")
            
            if not urgent_found and not urgent_notifications:
                responses.append("You don't have any pressing deadlines in the next 7 days.")
        if not action: action = '/dashboard'

    if wants_profile and not wants_urgent:
        responses.append(f"Your profile is {comp}% complete.")
        if profile:
            details = []
            if profile.cgpa: details.append(f"CGPA: {profile.cgpa}")
            if profile.annual_family_income: details.append(f"Income: ₹{profile.annual_family_income:,.0f}")
            if profile.category: details.append(f"Category: {profile.category}")
            if profile.institution: details.append(f"College: {profile.institution}")
            if profile.course: details.append(f"Course: {profile.course}")
            if details:
                responses.append("Details on record: " + ", ".join(details) + ".")
            else:
                responses.append("You have not filled in your academic or financial details yet.")
        if not action: action = '/profile'

    if wants_docs and not wants_urgent:
        if docs.exists():
            verified_count = docs.filter(status='VERIFIED').count()
            responses.append(f"You have {docs.count()} uploaded document(s), {verified_count} of which are verified.")
            
            # Contextual OCR data check
            income_doc = docs.filter(document_type='INCOME_CERT').first()
            if income_doc and 'income' in query:
                responses.append(f"Your Income Certificate OCR extracted an income of ₹{income_doc.extracted_income or 'N/A'}.")
            
            latest_doc = docs.order_by('-uploaded_at').first()
            if latest_doc:
                responses.append(f"Latest upload: {latest_doc.get_document_type_display()} (Status: {latest_doc.status}).")
        else:
            responses.append("You haven't uploaded any documents yet. Please upload your ID and certificates to enable AI OCR verification.")
        if not action: action = '/documents'

    if wants_scholarships and not wants_urgent:
        if profile:
            scholarships = Scholarship.objects.all()
            eligible_list = []
            for s in scholarships:
                score, details = calculate_match_score(profile, s)
                if details.get('eligibility_status') == 'ELIGIBLE':
                    eligible_list.append((s, score))
            
            eligible_list.sort(key=lambda x: x[1], reverse=True)
            if eligible_list:
                top_matches = [f"{s.name} ({score}%)" for s, score in eligible_list[:3]]
                responses.append(f"You are eligible for {len(eligible_list)} scholarship(s). Top matches: {', '.join(top_matches)}.")
            else:
                responses.append("Based on your current profile, you don't meet the full eligibility criteria for any scholarships yet.")
        else:
            responses.append("Please complete your profile to enable AI scholarship matching.")
        if not action: action = '/find-scholarships'

    if wants_apps and not wants_urgent:
        if apps.exists():
            next_app = apps.select_related('scholarship').order_by('scholarship__deadline').first()
            responses.append(f"You currently have {apps.count()} active applications:")
            
            for app in apps[:3]: # List top 3 for brevity
                responses.append(f"- {app.scholarship.name} (Status: {app.status}, Progress: {app.progress}%)")
                
            if apps.count() > 3:
                responses.append(f"...and {apps.count() - 3} more.")
                
            # Answer specific blocker/missing docs queries
            if any(k in query for k in ['missing', 'blocker', 'improve', 'next']):
                for app in apps:
                    if app.scholarship.name.lower() in query or (next_app and next_app == app):
                        s = app.scholarship
                        req_docs = []
                        if hasattr(s, 'requirements') and s.requirements and s.requirements.required_documents:
                            req_docs = [d.strip() for d in s.requirements.required_documents.split(',') if d.strip()]
                        
                        uploaded_types = set(docs.values_list('document_type', flat=True))
                        unverified_types = set(docs.exclude(status='VERIFIED').values_list('document_type', flat=True))
                        
                        missing = [d for d in req_docs if d not in uploaded_types]
                        unverified = [d for d in req_docs if d in unverified_types]
                        
                        if missing:
                            responses.append(f"For '{s.name}', you are missing: {', '.join(missing)}.")
                        elif unverified:
                            responses.append(f"For '{s.name}', pending verification: {', '.join(unverified)}.")
                        
                        if not missing and not unverified:
                            responses.append(f"All required documents for '{s.name}' are uploaded and verified!")
        else:
            responses.append("You don't have any active applications yet. Browse Find Scholarships to start applying!")
        if not action: action = '/applications'

    # If no specific keywords were matched, provide contextual help based on the page
    if not responses:
        if page_context == 'Documents':
            responses.append("You are on the Documents page. I can help you understand your OCR extraction results or verification status. Just ask!")
            action = '/documents'
        elif page_context == 'FindScholarships':
            responses.append("You are browsing scholarships. I can analyze your profile to tell you which ones you have the highest chance of getting!")
            action = '/find-scholarships'
        elif page_context == 'Profile':
            responses.append("You are on the Profile page. Filling this out completely helps me find better scholarship matches for you.")
            action = '/profile'
        elif scholarship_id:
            try:
                s = Scholarship.objects.get(id=scholarship_id)
                responses.append(f"Ask me anything about the '{s.name}' scholarship, like whether you are eligible or what documents you need!")
            except:
                pass
        else:
            responses.append("I'm your ScholarPilot AI Assistant! Ask me about your profile, document OCR data, eligibility, deadlines, or recommendations.")

    return Response({
        'reply': " ".join([r for r in responses if r]),
        'suggested_action': action
    })
