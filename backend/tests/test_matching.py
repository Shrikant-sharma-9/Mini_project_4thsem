import io
import json
from fastapi.testclient import TestClient
from main import app
from docx import Document

client = TestClient(app)

def test_resume_match():
    # Create a real mock DOCX file in memory
    doc = Document()
    doc.add_paragraph("Python developer with machine learning experience")
    doc_io = io.BytesIO()
    doc.save(doc_io)
    doc_io.seek(0)
    
    file = ("resume.docx", doc_io, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    
    # Mock job data required by the endpoint
    job_data = {
        "text": "Python developer with machine learning experience",
        "required_skills": ["python", "machine learning"],
        "min_experience_years": 2.0,
        "min_education_level": 1,
        "required_certifications": [],
        "keywords": ["python", "ml"],
        "match_threshold": 0.5
    }
    
    response = client.post(
        "/api/v1/resumes/upload-and-match",
        files={"file": file},
        data={"job_data_json": json.dumps(job_data)}
    )
    
    # The endpoint returns 200 on success
    assert response.status_code == 200
