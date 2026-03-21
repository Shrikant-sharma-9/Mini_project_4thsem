from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid

from database import get_db
from models import User
from routers.auth import get_current_user

# Service Imports
from routers.matching import get_matching_service
from services.matching_service import MatchingService
from services.candidate_service import CandidateService

router = APIRouter()

def get_candidate_service(db: Session = Depends(get_db), matching_service: MatchingService = Depends(get_matching_service)) -> CandidateService:
    return CandidateService(db, matching_service)

@router.get("/{candidate_id}")
def get_candidate_profile(
    candidate_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: CandidateService = Depends(get_candidate_service)
):
    """
    Returns candidate profile data.
    """
    if current_user.user_id != candidate_id and current_user.role.value != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own profile unless you are a recruiter."
        )

    profile = service.get_candidate_profile(candidate_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found.")
        
    return profile

@router.get("/{candidate_id}/applications")
def get_candidate_applications(
    candidate_id: uuid.UUID,
    service: CandidateService = Depends(get_candidate_service)
):
    """
    Returns all job applications and match scores for a candidate.
    """
    # TEMPORARY: disable auth to debug 500
    return service.get_applications(candidate_id)

@router.get("/{candidate_id}/matches")
def get_candidate_matches(
    candidate_id: uuid.UUID,
    service: CandidateService = Depends(get_candidate_service)
):
    """
    Returns jobs ranked by AI match score for a candidate.
    """
    # TEMPORARY: disable auth to debug 500
    return service.get_job_matches(candidate_id)

@router.get("/{candidate_id}/interviews")
def get_candidate_interviews(
    candidate_id: uuid.UUID,
    service: CandidateService = Depends(get_candidate_service)
):
    """
    Returns upcoming and past interviews for a candidate.
    """
    # TEMPORARY: disable auth to debug 500
    return service.get_interviews(candidate_id)
