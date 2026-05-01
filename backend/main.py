# Trigger database re-initialization
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from routers import jobs, resumes, matching, auth, candidates, interviews, feedback, applications
from database import init_db

app = FastAPI(
    title="Hiring Intelligence API",
    description="API for AI-Powered Resume-Job Matching System",
    version="1.0.0"
)

from fastapi.responses import JSONResponse
import traceback
import os

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from limiter import limiter

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler to ensure that no internal stack traces
    or sensitive information leak to the client on unhandled server errors.
    """
    # Log the full traceback internally securely
    print(f"Internal Server Error: {request.url}")
    print(traceback.format_exc())
    # Return generic message to client to prevent information leakage
    return JSONResponse(status_code=500, content={"detail": "An internal server error occurred. Please try again later."})

# Initialize Database tables
init_db()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(resumes.router, prefix="/api/v1/resumes", tags=["Resumes"])
app.include_router(matching.router, prefix="/api/v1/match", tags=["Matching"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["Candidates"])
app.include_router(interviews.router, prefix="/api/v1/interviews", tags=["Interviews"])
app.include_router(feedback.router, prefix="/api/v1/feedback", tags=["Feedback"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["Applications"])

@app.get("/")
def read_root():
    """
    Root endpoint to verify API reachability.
    """
    return {"message": "Welcome to Hiring Intelligence API"}

@app.get("/health")
def health_check():
    """
    Health check endpoint to verify that the API is up and running.
    Returns a simple JSON status object.
    """
    return {"status": "healthy", "service": "Hiring Intelligence API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
