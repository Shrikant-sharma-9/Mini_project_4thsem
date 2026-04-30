from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import json

from database import get_db
from models import Resume, User
from routers.auth import get_current_user, RoleChecker
from services.resume_parser import parse_resume
from routers.matching import get_matching_service, JobData, MatchResponse
from services.matching_service import MatchingService

router = APIRouter()

class ResumeDataModel(BaseModel):
    text: str = Field(..., min_length=1)
    skills: List[str] = Field(default_factory=list)
    experience_years: float = Field(default=0.0, ge=0)
    education_level: int = Field(default=0, ge=0, le=5)
    certifications: List[str] = Field(default_factory=list)

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
    current_user: User = Depends(RoleChecker(["CANDIDATE"])),
    db: Session = Depends(get_db)
):
    """
    Uploads a resume PDF natively, extracts the text using pdfplumber, 
    and returns a structured data representation. Saves the parsed data to the DB.
    """

    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] and not file.filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
        
    try:
        # Read file contents into memory
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
        # Parse text and extract structured entities
        parsed_data = parse_resume(file_bytes, file.filename)
        
        full_text = parsed_data.get("text", "")
        if not full_text.strip():
             raise HTTPException(status_code=400, detail="Failed to extract text from resume. Please ensure the file is not encrypted or corrupt.")

        # Check if user already has a resume and update, or create a new one
        try:
            existing_resume = db.query(Resume).filter(Resume.user_id == current_user.user_id).first()
            
            if existing_resume:
                existing_resume.parsed_text = full_text
                existing_resume.summary = ", ".join(parsed_data.get("skills", [])[:5]) # Simple summary
                existing_resume.experience_years = int(parsed_data.get("experience_years", 0))
            else:
                new_resume = Resume(
                    user_id=current_user.user_id,
                    parsed_text=full_text,
                    summary=", ".join(parsed_data.get("skills", [])[:5]),
                    experience_years=int(parsed_data.get("experience_years", 0))
                )
                db.add(new_resume)
                
            db.commit()
        except Exception as db_err:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error while saving resume: {str(db_err)}")

        # Prepare response
        return ParseResponse(
            status="success",
            filename=file.filename,
            extracted_text_preview=full_text[:1000] + ("..." if len(full_text) > 1000 else ""),
            full_text=full_text,
            resume_data=ResumeDataModel(**parsed_data)
        )
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while processing the resume: {str(e)}")

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
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] and not file.filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
        
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
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            
        parsed_resume_dict = parse_resume(file_bytes, file.filename)
        if not parsed_resume_dict.get("text", "").strip():
            raise HTTPException(status_code=400, detail="Failed to extract text from resume. Please ensure the file is not encrypted or corrupt.")
            
        resume_data_model = ResumeDataModel(**parsed_resume_dict)
        
        # 3. Call AI Matching Service
        # We reuse the matching_service directly, passing the raw dictionaries expected by the service
        match_result_dict = matching_service.evaluate_match(parsed_resume_dict, job_data.model_dump())
        
        # Add missing fields required by MatchResponse
        final_score = match_result_dict["final_score"]
        threshold = job_data.match_threshold
        status = "qualified" if final_score >= threshold else "below_threshold"
        
        match_result_dict["threshold"] = threshold
        match_result_dict["status"] = status
        
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
