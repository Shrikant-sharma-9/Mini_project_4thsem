from database import SessionLocal
from models import User, Resume, Job, Application, Interview
import uuid

db = SessionLocal()
email = 'shrikantsharma20052005@gmail.com'
user = db.query(User).filter(User.email == email).first()

if user:
    # Add dummy resume
    if not db.query(Resume).filter(Resume.user_id == user.user_id).first():
        resume = Resume(user_id=user.user_id, summary="Python, React")
        db.add(resume)
    
    # Add dummy recruiter
    recruiter_id = uuid.uuid4()
    dummy_recruiter = User(user_id=recruiter_id, email="recruiter2@test.com", password_hash="hash", first_name="Rec", last_name="Ruiter", role="RECRUITER")
    if not db.query(User).filter(User.email == "recruiter2@test.com").first():
        db.add(dummy_recruiter)
        db.commit()

    # Add dummy job 
    job_id = uuid.uuid4()
    if not db.query(Job).first():
        dummy_job = Job(job_id=job_id, recruiter_id=recruiter_id, title="Software Engineer", description="Code things", status="OPEN")
        db.add(dummy_job)
        db.commit()

    print('Seed complete.')
