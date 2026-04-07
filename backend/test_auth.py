from fastapi.testclient import TestClient
import pytest

def test_signup_success(client: TestClient):
    response = client.post("/api/v1/auth/signup", json={
        "email": "clean_candidate@example.com",
        "password": "strongpassword123",
        "first_name": "Test",
        "last_name": "User",
        "role": "CANDIDATE"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Account created successfully. You can now log in."
    assert response.json()["email"] == "clean_candidate@example.com"

def test_signup_duplicate_fails(client: TestClient):
    payload = {
        "email": "recruiter@example.com",
        "password": "pwd",
        "first_name": "A",
        "last_name": "B",
        "role": "RECRUITER"
    }
    client.post("/api/v1/auth/signup", json=payload)
    # The duplicate should inherently fail because of pure testing states!
    response2 = client.post("/api/v1/auth/signup", json=payload)
    assert response2.status_code == 400
    assert response2.json()["detail"] == "Email already registered"

def test_login_success(client: TestClient):
    client.post("/api/v1/auth/signup", json={
        "email": "login@example.com",
        "password": "password123",
        "first_name": "C",
        "last_name": "D",
        "role": "CANDIDATE"
    })
    
    response = client.post("/api/v1/auth/token", data={
        "username": "login@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_unauthorized(client: TestClient):
    client.post("/api/v1/auth/signup", json={
        "email": "fail@example.com",
        "password": "password123",
        "first_name": "E",
        "last_name": "F",
        "role": "CANDIDATE"
    })
    
    response = client.post("/api/v1/auth/token", data={
        "username": "fail@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect password"
