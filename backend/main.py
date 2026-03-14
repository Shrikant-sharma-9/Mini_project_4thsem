# Trigger database re-initialization
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from routers import jobs, resumes, matching, auth, candidates, interviews
from database import init_db

app = FastAPI(
    title="Hiring Intelligence API",
    description="API for AI-Powered Resume-Job Matching System",
    version="1.0.0"
)

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": str(exc), "traceback": traceback.format_exc()})

# Initialize Database tables
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(resumes.router, prefix="/api/v1/resumes", tags=["Resumes"])
app.include_router(matching.router, prefix="/api/v1/match", tags=["Matching"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["Candidates"])
app.include_router(interviews.router, prefix="/api/v1/interviews", tags=["Interviews"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Hiring Intelligence API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
