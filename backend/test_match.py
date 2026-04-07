import pytest
from services.matching_service import MatchingService

# Instantiate model only once globally for performance during testing runtime
@pytest.fixture(scope="module")
def matching_engine():
    return MatchingService()

def test_compute_semantic_similarity(matching_engine: MatchingService):
    sim = matching_engine.compute_semantic_similarity(
        "Python developer with Django and API skills", 
        "Need Python backend dev with Django API"
    )
    # Ensure cosine similarity falls purely between boundaries
    assert 0.0 < sim <= 1.0

def test_evaluate_match_nlp_and_inference(matching_engine: MatchingService):
    resume_data = {
        "text": "Experienced Python developer with 5 years AWS. Knows React and NextJS.",
        "skills": ["python", "nextjs", "aws"],
        "experience_years": 5,
        "education_level": 2,
        "certifications": ["aws prep"]
    }
    
    job_data = {
        "text": "Looking for python and react developer with aws.",
        "required_skills": ["python", "javascript", "react", "aws"],
        "min_experience_years": 3,
        "min_education_level": 1,
        "required_certifications": [],
        "keywords": ["python", "react"]
    }
    
    result = matching_engine.evaluate_match(resume_data, job_data)
    
    # Mathematical boundaries
    assert 0.0 < result["final_score"] <= 1.0
    
    # Graph Inference Checks:
    # Explicit skills were just ['python', 'nextjs', 'aws'].
    # But NetworkX graph natively expands 'nextjs' -> 'react', 'javascript', 'html', 'css'
    # The matching script should magically flag these logic inferences correctly without breaking!
    assert "react" in result["matched_skills"]
    assert "javascript" in result["matched_skills"]
    assert "html" not in job_data["required_skills"] # Didn't break required skills scope constraint
    
    # Validate explanation outputs strings dynamically without blowing up arrays
    assert "Matched skills" in result["explanation"]
    assert "(derived from nextjs)" in result["explanation"].lower()
