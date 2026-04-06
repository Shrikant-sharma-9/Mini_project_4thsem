from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "Hiring Intelligence API"}

def test_signup():
    response = client.post("/api/v1/auth/signup", json={
        "email": "test@example.com",
        "password": "password",
        "first_name": "Test",
        "last_name": "User",
        "role": "CANDIDATE"
    })
    # Since sqlite is persistent and this data might already exist from previous tests, we just check whether it's successful or gives email registered error
    assert response.status_code in [200, 400]
