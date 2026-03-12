from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import jobs, resumes, matching, auth
from database import init_db

app = FastAPI(
    title="Hiring Intelligence API",
    description="API for AI-Powered Resume-Job Matching System",
    version="1.0.0"
)

# Initialize Database tables
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(resumes.router, prefix="/api/v1/resumes", tags=["Resumes"])
app.include_router(matching.router, prefix="/api/v1/match", tags=["Matching"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Hiring Intelligence API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
