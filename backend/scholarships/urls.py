from django.urls import path
from .views import ScholarshipListView, ScholarshipDetailView, SavedScholarshipListView, SavedScholarshipDeleteView

urlpatterns = [
    path('', ScholarshipListView.as_view(), name='scholarship_list'),
    path('<int:pk>/', ScholarshipDetailView.as_view(), name='scholarship_detail'),
    path('saved/', SavedScholarshipListView.as_view(), name='saved_scholarships'),
    path('saved/<int:pk>/', SavedScholarshipDeleteView.as_view(), name='saved_scholarship_delete'),
]
