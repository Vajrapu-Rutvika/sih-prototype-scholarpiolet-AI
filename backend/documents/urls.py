from django.urls import path
from . import views

urlpatterns = [
    path('', views.DocumentListCreateView.as_view(), name='document-list-create'),
    path('readiness/', views.document_readiness, name='document-readiness'),
    path('<int:pk>/', views.DocumentDetailView.as_view(), name='document-detail'),
    path('<int:pk>/verify/', views.DocumentVerifyView.as_view(), name='document-verify'),
    path('<int:pk>/compare/', views.compare_document_with_profile, name='document-compare'),
]
