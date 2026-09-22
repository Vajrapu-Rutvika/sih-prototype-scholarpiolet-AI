import requests
import pytest
import os

BASE_URL = "http://localhost:8000/api"

@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    # Generate unique test user
    import uuid
    username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "StrongPassword123!"
    
    email = f"{username}@example.com"
    # 1. Register User
    resp = session.post(f"{BASE_URL}/auth/register/", data={
        "email": email,
        "password": password
    })
    assert resp.status_code == 201, f"Registration failed: {resp.text}"
    tokens = resp.json()
    
    # 2. Login User (Just to test login endpoint)
    resp = session.post(f"{BASE_URL}/auth/login/", data={
        "email": email,
        "password": password
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    tokens = resp.json()
    assert "access" in tokens
    
    # Set auth header
    session.headers.update({"Authorization": f"Bearer {tokens['access']}"})
    
    yield session

def test_profile_creation(api_client):
    # Create Profile
    profile_data = {
        "full_name": "Test User",
        "date_of_birth": "2000-01-01",
        "gender": "M",
        "phone_number": "1234567890",
        "address": "123 Test St",
        "city": "Testville",
        "state": "Maharashtra",
        "pincode": "400001",
        "category": "OBC",
        "annual_family_income": 300000,
        "disability_status": False,
        "current_education_level": "Undergraduate",
        "course_name": "B.Tech",
        "institution_name": "Test University",
        "cgpa": 8.5
    }
    resp = api_client.put(f"{BASE_URL}/auth/profile/", json=profile_data)
    assert resp.status_code in [200, 201], f"Profile update failed: {resp.text}"
    
    resp = api_client.get(f"{BASE_URL}/auth/profile/")
    assert resp.status_code == 200
    assert resp.json()["state"] == "Maharashtra"

def test_document_upload_and_ocr(api_client):
    # Upload document with dummy OCR data
    doc_data = {
        "document_type": "INCOME_CERT",
        "status": "VERIFIED",
        "raw_ocr_text": "GOVERNMENT OF MAHARASHTRA INCOME CERTIFICATE Name: Test User Income: 300000",
        "extracted_income": "300000"
    }
    # Since we can't easily mock an image file upload in this simple script without a real file, 
    # we'll test the document creation endpoint if it accepts JSON or form-data
    # Or just skip the file part if the serializer allows it (many times file is required).
    # Let's try sending a simple text file.
    files = {'file': ('dummy.txt', 'dummy content', 'text/plain')}
    data = {'document_type': 'INCOME_CERT'}
    resp = api_client.post(f"{BASE_URL}/documents/", files=files, data=data)
    # The endpoint might extract OCR, we just need a 201.
    assert resp.status_code == 201, f"Document upload failed: {resp.text}"

def test_ai_matches(api_client):
    resp = api_client.get(f"{BASE_URL}/ai/matches/?eligibility=ALL")
    assert resp.status_code == 200, f"AI matches failed: {resp.text}"
    data = resp.json()
    assert "matches" in data
    # Ensure our profile influences the matches (e.g. at least one match has score)
    if len(data["matches"]) > 0:
        assert "match_score" in data["matches"][0]

def test_ai_recommendations(api_client):
    resp = api_client.get(f"{BASE_URL}/ai/recommendations/")
    assert resp.status_code == 200, f"AI recs failed: {resp.text}"
    assert "recommendations" in resp.json()

def test_ai_copilot(api_client):
    # Ask about documents
    resp = api_client.post(f"{BASE_URL}/ai/copilot/", json={
        "query": "document",
        "page_context": "Dashboard"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert "action" in data or "suggested_action" in data
    
    # Ask about eligibility
    resp = api_client.post(f"{BASE_URL}/ai/copilot/", json={
        "query": "match",
        "page_context": "Dashboard"
    })
    assert resp.status_code == 200
    assert "reply" in resp.json()
