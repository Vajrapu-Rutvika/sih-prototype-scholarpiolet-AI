from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from .models import Application, ApplicationChecklist
from .serializers import ApplicationSerializer, ApplicationChecklistSerializer
from scholarships.models import Scholarship
from accounts.models import StudentProfile
from ai_engine.matching import calculate_match_score

class ApplicationListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user)

class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        app = serializer.save()
        if old_status != app.status:
            from .models import ApplicationHistory
            ApplicationHistory.objects.create(
                application=app,
                previous_status=old_status,
                new_status=app.status,
                changed_by=self.request.user
            )
            from notifications.services import trigger_status_notification
            trigger_status_notification(app)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_application(request, scholarship_id):
    scholarship = get_object_or_404(Scholarship, id=scholarship_id)
    
    # Check if already exists
    app, created = Application.objects.get_or_create(
        user=request.user,
        scholarship=scholarship,
        defaults={'status': 'PREPARING'}
    )
    
    if created:
        # Create initial checklist based on requirements if they exist
        if hasattr(scholarship, 'requirements') and scholarship.requirements.required_documents:
            docs = [d.strip() for d in scholarship.requirements.required_documents.split(',')]
            for doc in docs:
                if doc:
                    ApplicationChecklist.objects.create(
                        application=app,
                        item_name=f"Upload {doc}"
                    )
        # Default checklist items
        ApplicationChecklist.objects.get_or_create(application=app, item_name="Review Eligibility Requirements")
        ApplicationChecklist.objects.get_or_create(application=app, item_name="Submit Application on Official Portal")
        
        from notifications.models import Notification
        Notification.objects.create(
            user=request.user,
            notification_type='APPLICATION_CREATED',
            title='Application Started',
            message=f'{scholarship.name} has been added to your application tracker.',
            related_application=app
        )
        
        # Trigger status notification logic which will add missing doc notifications if any
        from notifications.services import trigger_status_notification
        trigger_status_notification(app)
    
    serializer = ApplicationSerializer(app)
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_checklist_item(request, item_id):
    item = get_object_or_404(ApplicationChecklist, id=item_id, application__user=request.user)
    
    if 'is_completed' in request.data:
        item.is_completed = request.data['is_completed']
        item.save()
        
        # Trigger application progress update
        item.application.save() 
        
    serializer = ApplicationChecklistSerializer(item)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def upcoming_deadlines(request):
    user = request.user
    applications = Application.objects.filter(user=user).select_related('scholarship')
    
    try:
        profile = user.profile
    except StudentProfile.DoesNotExist:
        profile = None
        
    results = []
    for app in applications:
        score = 0
        if profile:
            score, _ = calculate_match_score(profile, app.scholarship)
            
        results.append({
            'application_id': app.id,
            'scholarship_id': app.scholarship.id,
            'scholarship_name': app.scholarship.name,
            'provider': app.scholarship.provider,
            'deadline': app.scholarship.deadline,
            'status': app.status,
            'progress': app.progress,
            'match_score': score
        })
        
    # Sort by deadline date first, then by match score descending
    results.sort(key=lambda x: (x['deadline'], -x['match_score']))
    
    return Response({'deadlines': results})
