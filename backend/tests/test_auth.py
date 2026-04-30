import uuid
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_signup():
    random_id = uuid.uuid4().hex[:6]
    response = client.post("/api/v1/auth/signup", json={
        "email": f"test_{random_id}@example.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "role": "CANDIDATE"
    })
    assert response.status_code in [200, 201]
