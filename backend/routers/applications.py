from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from routers.auth import RoleChecker, get_current_user
from models import User
from services.application_service import create_application, get_applications_by_candidate, update_application_status

router = APIRouter()

class ApplicationCreate(BaseModel):
    candidate_id: str
    job_id: str
    match_score: float

class StatusUpdate(BaseModel):
    status: str

@router.post("/apply")
def apply_for_job(
    request: ApplicationCreate,
    current_user: User = Depends(RoleChecker(["CANDIDATE"])),
    db: Session = Depends(get_db)
):
    try:
        app = create_application(db, request.candidate_id, request.job_id, request.match_score)
        return {
            "message": "Application submitted successfully",
            "status": app.status.value,
            "application_id": str(app.application_id)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit application: {str(e)}")

@router.get("/{candidate_id}")
def get_candidate_applications(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        apps = get_applications_by_candidate(db, candidate_id)
        
        response_data = []
        for a in apps:
            response_data.append({
                "application_id": str(a.application_id),
                "job_id": str(a.job_id),
                "candidate_id": str(a.candidate_id),
                "match_score": float(a.match_score),
                "status": a.status.value,
                "created_at": a.created_at.isoformat()
            })
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving applications: {str(e)}")

@router.put("/{application_id}/status")
def update_status(
    application_id: str,
    update: StatusUpdate,
    current_user: User = Depends(RoleChecker(["RECRUITER"])),
    db: Session = Depends(get_db)
):
    try:
        app = update_application_status(db, application_id, update.status)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
            
        return {
            "message": "Status updated successfully",
            "status": app.status.value
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")

@router.get("/job/{job_id}")
def get_job_applications(
    job_id: str,
    current_user: User = Depends(RoleChecker(["RECRUITER"])),
    db: Session = Depends(get_db)
):
    from models import Application
    import uuid
    apps = db.query(Application).filter(Application.job_id == uuid.UUID(job_id)).all()
    
    result = []
    for a in apps:
        # Get candidate name
        cand = db.query(User).filter(User.user_id == a.candidate_id).first()
        name = cand.first_name + " " + cand.last_name if cand else "Unknown"
        
        result.append({
            "application_id": str(a.application_id),
            "candidate_id": str(a.candidate_id),
            "candidate_name": name,
            "match_score": float(a.match_score),
            "status": a.status.value,
            "created_at": a.created_at.isoformat()
        })
    return result
