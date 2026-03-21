from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import uuid

from database import get_db
from models import User, Interview
from routers.auth import get_current_user
from services.interview_service import InterviewService

router = APIRouter()

class InterviewCreate(BaseModel):
    candidate_id: uuid.UUID
    job_id: uuid.UUID
    scheduled_time: Optional[datetime] = None

class InterviewResponse(BaseModel):
    status: str
    candidate_id: uuid.UUID
    job_id: uuid.UUID
    scheduled_time: datetime

def get_interview_service(db: Session = Depends(get_db)) -> InterviewService:
    return InterviewService(db=db)

@router.post("/schedule", response_model=InterviewResponse)
def schedule_interview(
    payload: InterviewCreate,
    current_user: User = Depends(get_current_user),
    interview_service: InterviewService = Depends(get_interview_service)
):
    """
    Schedules an interview between a candidate and a recruiter.
    Auto-suggests a time if none is provided.
    """
    if current_user.role.value != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can schedule interviews."
        )

    try:
        # Construct Recruiter Name for tracking
        recruiter_name = f"{current_user.first_name} {current_user.last_name}"
        
        result = interview_service.schedule_interview(
            candidate_id=payload.candidate_id,
            job_id=payload.job_id,
            recruiter_name=recruiter_name,
            scheduled_time=payload.scheduled_time
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule interview: {str(e)}"
        )
