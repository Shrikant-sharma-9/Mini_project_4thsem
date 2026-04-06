from sqlalchemy.orm import Session
import uuid
from typing import List, Dict, Any, Optional

from models import User, Resume, Application, Job, ApplicationStatus, Interview
from services.matching_service import MatchingService

class CandidateService:
    def __init__(self, db: Session, matching_service: MatchingService):
        self.db = db
        self.matching_service = matching_service

    def get_candidate_profile(self, candidate_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        candidate_id = uuid.UUID(str(candidate_id))
        user = self.db.query(User).filter(User.user_id == candidate_id).first()
        if not user or user.role.value != "CANDIDATE":
            return None

        resume = self.db.query(Resume).filter(Resume.user_id == candidate_id).first()

        return {
            "candidate_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "resume_id": resume.resume_id if resume else None,
            "resume_url": resume.file_url if resume else None,
            "skills": [s.strip() for s in resume.summary.split(",")] if resume and resume.summary else [],
            "experience_years": resume.experience_years if resume else 0,
            "education_level": 0, # Placeholder as we don't store it yet
            "certifications": [], # Placeholder
            "resume_updated_at": resume.created_at if resume else None,
            "created_at": user.created_at
        }

    def get_applications(self, candidate_id: uuid.UUID) -> List[Dict[str, Any]]:
        candidate_id = uuid.UUID(str(candidate_id))
        applications = self.db.query(Application, Job).join(Job, Application.job_id == Job.job_id).filter(Application.candidate_id == candidate_id).order_by(Application.applied_at.desc()).all()
        
        result = []
        for app, job in applications:
            result.append({
                "application_id": app.application_id,
                "job_id": job.job_id,
                "job_title": job.title,
                "company": "Company", # Placeholder, would come from Recruiter/Company profile
                "match_score": float(app.match_score),
                "status": app.status.value,
                "applied_at": app.applied_at
            })
        return result

    def get_interviews(self, candidate_id: uuid.UUID) -> List[Dict[str, Any]]:
        candidate_id = uuid.UUID(str(candidate_id))
        interviews = self.db.query(Interview, Job).join(Job, Interview.job_id == Job.job_id).filter(Interview.candidate_id == candidate_id).order_by(Interview.scheduled_time.asc()).all()
        
        result = []
        for interview, job in interviews:
            result.append({
                "interview_id": str(interview.interview_id),
                "job_id": str(job.job_id),
                "job_title": job.title,
                "recruiter_name": interview.recruiter_name,
                "scheduled_time": interview.scheduled_time.isoformat(),
                "status": interview.status.value
            })
        return result

    def get_job_matches(self, candidate_id: uuid.UUID) -> List[Dict[str, Any]]:
        candidate_id = uuid.UUID(str(candidate_id))
        # This will rank all open jobs for a candidate based on their resume
        resume = self.db.query(Resume).filter(Resume.user_id == candidate_id).first()
        if not resume:
            return []

        open_jobs = self.db.query(Job).filter(Job.status == "OPEN").all()
        
        resume_skills_list = [s.strip().lower() for s in resume.summary.split(",")] if resume.summary else []
        resume_data_dict = {
            "text": resume.parsed_text or "",
            "skills": resume_skills_list,
            "experience_years": float(resume.experience_years) if resume.experience_years else 0.0,
            "education_level": 0,
            "certifications": []
        }

        results = []
        for job in open_jobs:
            job_skills_list = [s.strip().lower() for s in job.required_skills.split(",")] if job.required_skills else []
            job_data_dict = {
                "text": f"{job.title} - {job.description}",
                "required_skills": job_skills_list,
                "min_experience_years": float(job.min_experience_years) if job.min_experience_years else 0.0,
                "min_education_level": int(job.min_education_level) if job.min_education_level else 0,
                "required_certifications": [],
                "keywords": job_skills_list
            }

            try:
                match_result_dict = self.matching_service.evaluate_match(resume_data_dict, job_data_dict)
                results.append({
                    "job_id": job.job_id,
                    "title": job.title,
                    "location": job.location,
                    "match_score": match_result_dict["final_score"],
                    "semantic_similarity": match_result_dict["semantic_similarity"],
                    "matched_skills": match_result_dict["matched_skills"],
                    "missing_skills": match_result_dict["missing_skills"],
                    "explanation": match_result_dict["explanation"],
                    "min_salary": float(job.min_salary) if job.min_salary else None,
                    "max_salary": float(job.max_salary) if job.max_salary else None,
                    "created_at": job.created_at
                })
            except Exception as e:
                print(f"Error matching job {job.job_id} for candidate {candidate_id}: {e}")
                continue

        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results

def get_candidate_service(db: Session, matching_service: MatchingService) -> CandidateService:
    return CandidateService(db, matching_service)
