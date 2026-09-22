from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from .models import Document
from .serializers import DocumentSerializer, DocumentVerificationSerializer
from . import ocr_engine
from applications.models import Application
from accounts.models import StudentProfile

class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        doc = serializer.save(user=self.request.user)
        if doc.file:
            try:
                # Extract text using real EasyOCR / PyMuPDF engine
                file_path = doc.file.path
                raw_text = ocr_engine.extract_text(file_path)
                
                doc.raw_ocr_text = raw_text or "No text extracted from document scan."
                doc.confidence = 0.92 if raw_text else 0.50
                
                if raw_text:
                    parsed_data = ocr_engine.parse_fields(raw_text, doc.document_type)
                    for key, value in parsed_data.items():
                        if hasattr(doc, key):
                            setattr(doc, key, value)
            except Exception as e:
                print(f"OCR Processing failed: {e}")
                doc.raw_ocr_text = f"Error scanning document: {str(e)}"
                doc.confidence = 0.0

            doc.status = 'VERIFICATION_REQUIRED'
            doc.save()

class DocumentDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

class DocumentVerifyView(generics.UpdateAPIView):
    serializer_class = DocumentVerificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        doc = serializer.save(status='VERIFIED')
        
        # If user accepts sync to profile
        if self.request.data.get('sync_to_profile', False):
            try:
                profile = self.request.user.profile
                if doc.extracted_income:
                    profile.annual_family_income = doc.extracted_income
                if doc.extracted_institution:
                    profile.institution = doc.extracted_institution
                if doc.extracted_category:
                    profile.category = doc.extracted_category
                profile.save()
            except StudentProfile.DoesNotExist:
                pass

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def compare_document_with_profile(request, pk):
    """
    Compare document OCR extracted data against student profile.
    """
    doc = get_object_or_404(Document, id=pk, user=request.user)
    try:
        profile = request.user.profile
    except StudentProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=400)
        
    comparisons = []
    
    # 1. Name Comparison
    if doc.extracted_name:
        prof_name = f"{request.user.first_name} {request.user.last_name}".strip()
        matched = doc.extracted_name.lower() in prof_name.lower() or prof_name.lower() in doc.extracted_name.lower()
        comparisons.append({
            'field': 'Name',
            'profile_value': prof_name,
            'document_value': doc.extracted_name,
            'is_matched': matched
        })
        
    # 2. Income Comparison
    if doc.extracted_income is not None:
        matched = profile.annual_family_income is not None and abs(profile.annual_family_income - doc.extracted_income) < 1000
        comparisons.append({
            'field': 'Annual Family Income',
            'profile_value': f"₹{profile.annual_family_income}" if profile.annual_family_income else 'Not set',
            'document_value': f"₹{doc.extracted_income}",
            'is_matched': matched
        })

    # 3. Category Comparison
    if doc.extracted_category:
        matched = profile.category and profile.category.lower() == doc.extracted_category.lower()
        comparisons.append({
            'field': 'Category',
            'profile_value': profile.category or 'Not set',
            'document_value': doc.extracted_category,
            'is_matched': matched
        })

    return Response({
        'document_id': doc.id,
        'document_type': doc.document_type,
        'status': doc.status,
        'raw_ocr_text': doc.raw_ocr_text,
        'confidence': doc.confidence,
        'comparisons': comparisons
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def document_readiness(request):
    user = request.user
    applications = Application.objects.filter(user=user, status__in=['PREPARING', 'SAVED', 'DISCOVERED'])
    
    required_docs = set()
    for app in applications:
        if hasattr(app.scholarship, 'requirements') and app.scholarship.requirements.required_documents:
            docs = [d.strip() for d in app.scholarship.requirements.required_documents.split(',')]
            required_docs.update(docs)
            
    uploaded_docs = Document.objects.filter(user=user, status='VERIFIED').values_list('document_type', flat=True)
    
    missing = [doc for doc in required_docs if doc not in uploaded_docs]
    
    readiness_score = 100
    if required_docs:
        readiness_score = int((len(required_docs) - len(missing)) / len(required_docs) * 100)
        
    return Response({
        'required': list(required_docs),
        'uploaded': list(uploaded_docs),
        'missing': missing,
        'score': readiness_score
    })
