from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
import json

from database import get_db
from models import Resume, User
from routers.auth import get_current_user
from services.resume_parser import parse_resume
from routers.matching import get_matching_service, JobData, MatchResponse
from services.matching_service import MatchingService

router = APIRouter()

class ResumeDataModel(BaseModel):
    text: str
    skills: List[str]
    experience_years: float
    education_level: int
    certifications: List[str]

class ParseResponse(BaseModel):
    status: str
    filename: str
    extracted_text_preview: str
    full_text: str
    resume_data: ResumeDataModel

class UploadAndMatchResponse(BaseModel):
    resume_data: ResumeDataModel
    match_result: MatchResponse

@router.post("/upload", response_model=ParseResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads a resume PDF natively, extracts the text using pdfplumber, 
    and returns a structured data representation. Saves the parsed data to the DB.
    """
    if current_user.role.value != "CANDIDATE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can upload resumes."
        )

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        # Read file contents into memory
        file_bytes = await file.read()
        
        # Parse text and extract structured entities
        parsed_data = parse_resume(file_bytes)
        
        full_text = parsed_data["text"]
        
        # Check if user already has a resume and update, or create a new one
        existing_resume = db.query(Resume).filter(Resume.user_id == current_user.user_id).first()
        
        if existing_resume:
            existing_resume.parsed_text = full_text
            existing_resume.summary = ", ".join(parsed_data["skills"][:5]) # Simple summary
            existing_resume.experience_years = int(parsed_data["experience_years"])
        else:
            new_resume = Resume(
                user_id=current_user.user_id,
                parsed_text=full_text,
                summary=", ".join(parsed_data["skills"][:5]),
                experience_years=int(parsed_data["experience_years"])
            )
            db.add(new_resume)
            
        db.commit()

        # Prepare response
        return ParseResponse(
            status="success",
            filename=file.filename,
            extracted_text_preview=full_text[:1000] + ("..." if len(full_text) > 1000 else ""),
            full_text=full_text,
            resume_data=ResumeDataModel(**parsed_data)
        )
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while parsing the resume: {str(e)}")

@router.post("/upload-and-match", response_model=UploadAndMatchResponse)
async def upload_and_match(
    file: UploadFile = File(...),
    job_data_json: str = Form(..., description="JSON string representation of JobData"),
    matching_service: MatchingService = Depends(get_matching_service)
):
    """
    End-to-End Flow: Uploads PDF, parses text & entities, and immediately scores against job data.
    Requires multipart/form-data. JobData must be passed as a serialized JSON string field.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        # 1. Parse Job Data payload
        try:
            job_dict = json.loads(job_data_json)
            # Validate payload using Pydantic implicitly
            job_data = JobData(**job_dict)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Invalid job_data_json format: {str(e)}")

        # 2. Extract PDF text and parse Resume Entities
        file_bytes = await file.read()
        parsed_resume_dict = parse_resume(file_bytes)
        resume_data_model = ResumeDataModel(**parsed_resume_dict)
        
        # 3. Call AI Matching Service
        # We reuse the matching_service directly, passing the raw dictionaries expected by the service
        match_result_dict = matching_service.evaluate_match(parsed_resume_dict, job_data.model_dump())
        
        # 4. Return Full Object
        return UploadAndMatchResponse(
            resume_data=resume_data_model,
            match_result=MatchResponse(**match_result_dict)
        )
        
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during matching: {str(e)}")
