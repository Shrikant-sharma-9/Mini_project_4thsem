import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Numeric, Integer, DateTime, Enum, ForeignKey, Boolean, UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class UserRole(enum.Enum):
    CANDIDATE = "CANDIDATE"
    RECRUITER = "RECRUITER"
    ADMIN = "ADMIN"

class JobStatus(enum.Enum):
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    CLOSED = "CLOSED"

class ApplicationStatus(enum.Enum):
    PENDING = "PENDING"
    SHORTLISTED = "SHORTLISTED"
    REJECTED = "REJECTED"

class InterviewStatus(enum.Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class User(Base):
    __tablename__ = 'users'
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CANDIDATE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)



class Job(Base):
    __tablename__ = 'jobs'
    
    job_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(String(500), default="") # Comma-separated or JSON
    min_experience_years = Column(Numeric(4, 1), default=0.0)
    min_education_level = Column(Integer, default=0)
    location = Column(String(255))
    min_salary = Column(Numeric(12, 2))
    max_salary = Column(Numeric(12, 2))
    match_threshold = Column(Numeric(3, 2), default=0.60)
    status = Column(Enum(JobStatus), default=JobStatus.OPEN)
    created_at = Column(DateTime, default=datetime.utcnow)

class Resume(Base):
    __tablename__ = 'resumes'
    
    resume_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, unique=True)
    file_url = Column(String(500))
    parsed_text = Column(Text)
    summary = Column(Text)
    experience_years = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Application(Base):
    __tablename__ = 'applications'
    
    application_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey('jobs.job_id', ondelete='CASCADE'), nullable=False)
    match_score = Column(Numeric(5, 2), default=0.0)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING)
    applied_at = Column(DateTime, default=datetime.utcnow)

class Interview(Base):
    __tablename__ = 'interviews'
    
    interview_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey('jobs.job_id', ondelete='CASCADE'), nullable=False)
    recruiter_name = Column(String(255), nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.SCHEDULED)
    created_at = Column(DateTime, default=datetime.utcnow)
