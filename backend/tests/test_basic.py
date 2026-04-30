from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    # Check for 200 or 404 depending on implementation, but user wants 200
    assert response.status_code == 200
