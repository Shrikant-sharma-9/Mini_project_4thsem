from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional

from services.matching_service import MatchingService

router = APIRouter()

# Instantiate the matching service. 
# In production, this might be handled via dependency injection to avoid reloading the model on every request
# if the worker gets restarted, but for now a global instance attached to the router scope is fine.
matching_service_instance = MatchingService()

def get_matching_service():
    return matching_service_instance

class ResumeData(BaseModel):
    text: str
    skills: List[str] = Field(default_factory=list)
    experience_years: float = 0.0
    education_level: int = 0
    certifications: List[str] = Field(default_factory=list)

class JobData(BaseModel):
    text: str
    required_skills: List[str] = Field(default_factory=list)
    min_experience_years: float = 0.0
    min_education_level: int = 0
    required_certifications: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)

class MatchRequest(BaseModel):
    resume_data: ResumeData
    job_data: JobData

class MatchResponse(BaseModel):
    final_score: float
    semantic_similarity: float
    missing_skills: List[str]
    matched_skills: List[str]
    explanation: str

@router.post("/", response_model=MatchResponse)
def evaluate_match(
    payload: MatchRequest, 
    matching_service: MatchingService = Depends(get_matching_service)
):
    """
    Evaluates a candidate's resume against a job description using AI context and structured parameters.
    """
    try:
        # Pydantic automatically serializes the models to dictionaries via .model_dump() / .dict()
        resume_dict = payload.resume_data.model_dump()
        job_dict = payload.job_data.model_dump()
        
        result = matching_service.evaluate_match(resume_dict, job_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching evaluation failed: {str(e)}")
