import uuid
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Interview, InterviewStatus, User, Job
class InterviewService:
    def __init__(self, db: Session):
        self.db = db
        
    def schedule_interview(
        self, 
        candidate_id: uuid.UUID, 
        job_id: uuid.UUID, 
        recruiter_name: str, 
        scheduled_time: Optional[datetime] = None
    ) -> dict:
        """
        Schedules a new interview. Applies automatic time suggestion logic if none is provided.
        """
        if not scheduled_time:
            # Automatic Time Suggestion: Tomorrow at 10 AM or 2 PM depending on request time
            now = datetime.now()
            tomorrow = now + timedelta(days=1)
            
            # Default to 10 AM if morning, else 2 PM
            if now.hour < 12:
                scheduled_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
            else:
                scheduled_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)
                
        # Create Interview Record
        new_interview = Interview(
            candidate_id=candidate_id,
            job_id=job_id,
            recruiter_name=recruiter_name,
            scheduled_time=scheduled_time,
            status=InterviewStatus.SCHEDULED
        )
        
        self.db.add(new_interview)
        self.db.commit()
        self.db.refresh(new_interview)
        
        # Trigger Automated Email Notification
        # (Email notification disabled as EmailService was removed)
        # try:
        #     candidate = self.db.query(User).filter(User.user_id == candidate_id).first()
        #     job = self.db.query(Job).filter(Job.job_id == job_id).first()
        #     
        #     if candidate and job:
        #         self.email_service.send_interview_invitation(
        #             to_email=candidate.email,
        #             candidate_name=candidate.first_name,
        #             job_title=job.title,
        #             scheduled_time=scheduled_time,
        #             recruiter_name=recruiter_name
        #         )
        # except Exception as e:
        #     print(f"Non-fatal error sending interview email: {e}")
        
        return {
            "status": "scheduled",
            "candidate_id": str(new_interview.candidate_id),
            "job_id": str(new_interview.job_id),
            "scheduled_time": new_interview.scheduled_time.isoformat()
        }
