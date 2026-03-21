from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}

# Resume Upload API (for your frontend)
@app.post("/api/v1/resumes/upload")
async def upload_resume(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "skills": ["Python", "AI", "ML"],
        "experience": "1-2 years",
        "message": "Resume parsed successfully ✅"
    }
