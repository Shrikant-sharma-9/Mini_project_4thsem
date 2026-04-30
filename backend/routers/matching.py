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
    text: str = Field(..., min_length=1, description="Full text of the resume")
    skills: List[str] = Field(default_factory=list)
    experience_years: float = Field(default=0.0, ge=0)
    education_level: int = Field(default=0, ge=0, le=5)
    certifications: List[str] = Field(default_factory=list)

class JobData(BaseModel):
    text: str = Field(..., min_length=1, description="Full text of the job description")
    required_skills: List[str] = Field(default_factory=list)
    min_experience_years: float = Field(default=0.0, ge=0)
    min_education_level: int = Field(default=0, ge=0, le=5)
    required_certifications: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    match_threshold: float = Field(default=0.6, ge=0.0, le=1.0)

class MatchRequest(BaseModel):
    resume_data: ResumeData
    job_data: JobData

class MatchResponse(BaseModel):
    final_score: float
    semantic_similarity: float
    missing_skills: List[str]
    matched_skills: List[str]
    explanation: str
    threshold: float
    status: str

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
        
        # Explicit validation for required fields to return HTTP 400
        if not resume_dict.get("text") or not resume_dict["text"].strip():
            raise HTTPException(status_code=400, detail="Resume text is required and cannot be empty.")
        if not job_dict.get("text") or not job_dict["text"].strip():
            raise HTTPException(status_code=400, detail="Job text is required and cannot be empty.")
        
        result = matching_service.evaluate_match(resume_dict, job_dict)
        
        final_score = result["final_score"]
        threshold = job_dict.get("match_threshold", 0.6)
        status = "qualified" if final_score >= threshold else "below_threshold"
        
        result["threshold"] = threshold
        result["status"] = status
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching evaluation failed: {str(e)}")
