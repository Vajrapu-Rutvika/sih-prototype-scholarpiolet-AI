from django.urls import path
from . import views

urlpatterns = [
    path('', views.ApplicationListView.as_view(), name='application-list'),
    path('deadlines/', views.upcoming_deadlines, name='upcoming-deadlines'),
    path('<int:pk>/', views.ApplicationDetailView.as_view(), name='application-detail'),
    path('start/<int:scholarship_id>/', views.start_application, name='application-start'),
    path('checklist/<int:item_id>/', views.update_checklist_item, name='checklist-update'),
]
