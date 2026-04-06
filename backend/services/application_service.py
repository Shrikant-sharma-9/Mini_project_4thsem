from sqlalchemy.orm import Session
from models import Application, ApplicationStatus
import uuid

def create_application(db: Session, candidate_id: str, job_id: str, match_score: float):
    # Check if application already exists
    existing = db.query(Application).filter(
        Application.candidate_id == uuid.UUID(candidate_id),
        Application.job_id == uuid.UUID(job_id)
    ).first()
    
    if existing:
        return existing

    new_app = Application(
        candidate_id=uuid.UUID(candidate_id),
        job_id=uuid.UUID(job_id),
        match_score=match_score,
        status=ApplicationStatus.PENDING
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

def get_applications_by_candidate(db: Session, candidate_id: str):
    return db.query(Application).filter(Application.candidate_id == uuid.UUID(candidate_id)).all()

def update_application_status(db: Session, application_id: str, status: str):
    app = db.query(Application).filter(Application.application_id == uuid.UUID(application_id)).first()
    if not app:
        return None
    
    # Handle both string values and Enum conversion easily
    status_enum = ApplicationStatus.PENDING
    if "shortlist" in status.lower():
        status_enum = ApplicationStatus.SHORTLISTED
    elif "reject" in status.lower():
        status_enum = ApplicationStatus.REJECTED
        
    app.status = status_enum
    db.commit()
    db.refresh(app)
    return app
