from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import User, Feedback
from routers.auth import get_current_user

router = APIRouter()

class FeedbackCreate(BaseModel):
    rating: int # 1 to 5
    comments: Optional[str] = None

@router.post("/", status_code=201)
def submit_feedback(
    payload: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not (1 <= payload.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    new_feedback = Feedback(
        user_id=current_user.user_id,
        rating=payload.rating,
        comments=payload.comments
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    return {"message": "Feedback submitted successfully"}
