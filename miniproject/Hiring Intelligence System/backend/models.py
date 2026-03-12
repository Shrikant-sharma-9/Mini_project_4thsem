import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Numeric, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
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
