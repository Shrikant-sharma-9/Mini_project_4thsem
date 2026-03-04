# AI-Powered Resume-Job Matching & Hiring Intelligence System

## Objective
To build an AI-driven semantic resume-job matching platform using NLP and machine learning ranking models.

This repository contains the backend and frontend code for an intelligent match-making platform designed to connect candidate resumes to relevant jobs using FAISS and Sentence Transformers.

## Domain
HRTech | NLP | ML Ranking Systems

## Core Features
*   **Resume Parsing**
*   **Skill Inference**
*   **ML-based Ranking**
*   **Explainable AI**
*   **Recruiter & Candidate Dashboards**

## Tech Stack & Infrastructure
*   **Backend**: FastAPI
*   **Frontend**: React (Next.js)
*   **Database**: PostgreSQL
*   **Vector DB**: FAISS
*   **AI Models**: Sentence Transformers (`all-MiniLM-L6-v2`)

## Folder Structure
*   `/backend`: Contains the FastAPI application, database settings, and AI routing logic.
*   `/frontend`: Contains the React/Next.js frontend dashboards.
*   `/database`: Contains init SQL scripts and DB configurations.
*   `/docker`: Contains Dockerfiles for containerization.

## Quickstart
1. Run `docker-compose up -d` in the root directory to spin up PostgreSQL.
2. Navigate to `backend/` and run `pip install -r requirements.txt`.
3. Start the backend with `python main.py` or `uvicorn main:app --reload`.
4. In a new terminal, navigate to `frontend/` and run `npm install` followed by `npm run dev`.
