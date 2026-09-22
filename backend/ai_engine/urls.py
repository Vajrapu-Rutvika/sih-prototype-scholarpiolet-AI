from django.urls import path
from . import views

urlpatterns = [
    path('eligibility/<int:scholarship_id>/', views.check_eligibility, name='check-eligibility'),
    path('matches/', views.get_matched_scholarships, name='matched-scholarships'),
    path('recommendations/', views.recommendations, name='recommendations'),
    path('copilot/', views.copilot_chat, name='copilot-chat'),
]
