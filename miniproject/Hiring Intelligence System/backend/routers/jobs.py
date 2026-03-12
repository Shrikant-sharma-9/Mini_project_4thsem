from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
import json

from database import get_db
from models import Job, User, JobStatus, Resume
from routers.auth import get_current_user

# Added matching service imports
from routers.matching import get_matching_service, MatchResponse, JobData
from services.matching_service import MatchingService

router = APIRouter()

class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: str = ""
    min_experience_years: float = 0.0
    min_education_level: int = 0

class JobResponse(BaseModel):
    job_id: uuid.UUID
    recruiter_id: uuid.UUID
    title: str
    description: str
    required_skills: str
    min_experience_years: float
    min_education_level: int
    status: JobStatus
    created_at: datetime

    class Config:
        from_attributes = True

class CandidateRankResponse(BaseModel):
    user_id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    match_score: float
    semantic_similarity: float
    matched_skills: List[str]
    missing_skills: List[str]
    explanation: str
    experience_years: int
    resume_summary: Optional[str]

@router.post("/", response_model=JobResponse)
def create_job(
    job: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can create jobs."
        )

    new_job = Job(
        recruiter_id=current_user.user_id,
        title=job.title,
        description=job.description,
        required_skills=job.required_skills,
        min_experience_years=job.min_experience_years,
        min_education_level=job.min_education_level
    )
    
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    return new_job

@router.get("/", response_model=List[JobResponse])
def list_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns jobs posted by the current recruiter.
    """
    if current_user.role.value != "RECRUITER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only recruiters can view their jobs."
            )
            
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.user_id, Job.status == JobStatus.OPEN).all()
    return jobs

@router.get("/{job_id}/candidates", response_model=List[CandidateRankResponse])
def get_ranked_candidates_for_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    matching_service: MatchingService = Depends(get_matching_service)
):
    """
    Fetches all candidate resumes, structures the data, runs the Matching Service 
    against this specific job, and sorts them by score descendings.
    """
    if current_user.role.value != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can view candidates."
        )

    # 1. Fetch Job
    job = db.query(Job).filter(Job.job_id == job_id, Job.recruiter_id == current_user.user_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized.")

    # Convert comma separated string to list
    job_skills_list = [s.strip().lower() for s in job.required_skills.split(",")] if job.required_skills else []

    job_data_dict = {
        "text": f"{job.title} - {job.description}",
        "required_skills": job_skills_list,
        "min_experience_years": float(job.min_experience_years) if job.min_experience_years else 0.0,
        "min_education_level": int(job.min_education_level) if job.min_education_level else 0,
        "required_certifications": [],
        "keywords": job_skills_list
    }

    # 2. Fetch All Resumes with their associated Users
    resumes = db.query(Resume, User).join(User, Resume.user_id == User.user_id).all()
    
    results = []
    
    for resume, user in resumes:
        # Reconstruct resume data dict for matching service
        # Note: We didn't save explicit education/certs lists in the DB yet, so we parse basic structure from summary or rely totally on the parsed_text.
        resume_skills_list = [s.strip().lower() for s in resume.summary.split(",")] if resume.summary else []

        resume_data_dict = {
            "text": resume.parsed_text,
            "skills": resume_skills_list,
            "experience_years": float(resume.experience_years) if resume.experience_years else 0.0,
            "education_level": 0,
            "certifications": []
        }

        # 3. Call AI Matching Service
        try:
            match_result_dict = matching_service.evaluate_match(resume_data_dict, job_data_dict)
            
            results.append(CandidateRankResponse(
                user_id=user.user_id,
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                match_score=match_result_dict["final_score"],
                semantic_similarity=match_result_dict["semantic_similarity"],
                matched_skills=match_result_dict["matched_skills"],
                missing_skills=match_result_dict["missing_skills"],
                explanation=match_result_dict["explanation"],
                experience_years=resume.experience_years or 0,
                resume_summary=resume.summary
            ))
        except Exception as e:
            # Skip candidates that fail to process
            print(f"Error matching candidate {user.user_id}: {e}")
            continue

    # 4. Sort results descending by score
    results.sort(key=lambda x: x.match_score, reverse=True)
    
    return results
