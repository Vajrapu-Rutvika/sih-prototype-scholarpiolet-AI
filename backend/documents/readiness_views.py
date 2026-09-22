from rest_framework.decorators import api_view, permission_classes
from applications.models import Application
from .models import Document

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def document_readiness(request):
    user = request.user
    
    # Get all required documents from all PREPARING or SAVED applications
    applications = Application.objects.filter(user=user, status__in=['PREPARING', 'SAVED', 'DISCOVERED'])
    
    required_docs = set()
    for app in applications:
        if hasattr(app.scholarship, 'requirements') and app.scholarship.requirements.required_documents:
            docs = [d.strip() for d in app.scholarship.requirements.required_documents.split(',')]
            required_docs.update(docs)
            
    # Get user's uploaded documents
    uploaded_docs = Document.objects.filter(user=user).values_list('document_type', flat=True)
    
    readiness = {
        'required': list(required_docs),
        'uploaded': list(uploaded_docs),
        'missing': [doc for doc in required_docs if doc not in uploaded_docs],
        'score': 0
    }
    
    if required_docs:
        readiness['score'] = int((len(required_docs) - len(readiness['missing'])) / len(required_docs) * 100)
    else:
        readiness['score'] = 100
        
    return Response(readiness)
