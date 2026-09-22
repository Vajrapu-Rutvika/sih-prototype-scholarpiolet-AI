from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import Scholarship, SavedScholarship
from .serializers import ScholarshipSerializer, SavedScholarshipSerializer

class ScholarshipListView(generics.ListAPIView):
    queryset = Scholarship.objects.all()
    serializer_class = ScholarshipSerializer
    permission_classes = (permissions.AllowAny,)
    
    def get_queryset(self):
        queryset = Scholarship.objects.all()
        # Basic filtering
        search = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(provider__icontains=search))
        if category:
            queryset = queryset.filter(category=category)
        return queryset

class ScholarshipDetailView(generics.RetrieveAPIView):
    queryset = Scholarship.objects.all()
    serializer_class = ScholarshipSerializer
    permission_classes = (permissions.AllowAny,)

class SavedScholarshipListView(generics.ListCreateAPIView):
    serializer_class = SavedScholarshipSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return SavedScholarship.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        scholarship_id = request.data.get('scholarship_id')
        if not scholarship_id:
            return Response({'error': 'scholarship_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            scholarship = Scholarship.objects.get(id=scholarship_id)
            saved, created = SavedScholarship.objects.get_or_create(user=request.user, scholarship=scholarship)
            if created:
                return Response(SavedScholarshipSerializer(saved).data, status=status.HTTP_201_CREATED)
            return Response({'message': 'Already saved'}, status=status.HTTP_200_OK)
        except Scholarship.DoesNotExist:
            return Response({'error': 'Scholarship not found'}, status=status.HTTP_404_NOT_FOUND)

class SavedScholarshipDeleteView(generics.DestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return SavedScholarship.objects.filter(user=self.request.user)
    
    def delete(self, request, *args, **kwargs):
        scholarship_id = self.kwargs.get('pk')
        try:
            saved = SavedScholarship.objects.get(user=request.user, scholarship__id=scholarship_id)
            saved.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SavedScholarship.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
