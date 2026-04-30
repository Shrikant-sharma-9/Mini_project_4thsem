# AI-Powered Resume-Job Matching & Hiring Intelligence System

![Hiring Intelligence Hero](./hero_image.png)

## 🚀 Overview
The **AI-Powered Hiring Intelligence System** is a state-of-the-art recruitment platform designed to bridge the gap between talent and opportunity. By leveraging advanced Natural Language Processing (NLP) and machine learning ranking models, it provides highly accurate, semantic matching between candidate resumes and job descriptions.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)

---

## ✨ Key Features
- **AI-Driven Semantic Matching**: Uses Sentence Transformers (`all-MiniLM-L6-v2`) and FAISS to match resumes based on context, not just keywords.
- **Intelligent Resume Parsing**: Automatically extracts skills, experience, and education from candidate resumes.
- **Role-Based Dashboards**: Tailored interfaces for both Recruiter (hiring management) and Candidates (job discovery).
- **Explainable AI**: Provides detailed match scores and explanations for every recommendation.
- **Scalable Architecture**: Built with a modular microservices approach, ready for containerization.

---

## 🧠 How It Works (AI Logic)
Our matching engine uses a sophisticated multi-stage pipeline to evaluate candidate fitness:

1.  **Resume Parsing**: Deep extraction of text and entities from PDF/DOCX files using specialized NLP pipelines.
2.  **Semantic Embedding**: Generating 384-dimensional dense vectors using the `all-MiniLM-L6-v2` Sentence Transformer model.
3.  **Vector Similarity**: High-performance search using **FAISS** (Facebook AI Similarity Search) to compute the cosine similarity between job requirements and candidate profiles.
4.  **Knowledge Graph Inference**: Utilizing a directed graph (NetworkX) to infer implied skills (e.g., knowing 'React' implies 'JavaScript' proficiency).
5.  **Weighted Scoring**: A transparent scoring formula designed for precision:
    -   **40% Skills**: Based on explicit matches and knowledge graph inferences.
    -   **30% Experience**: Quantitative comparison of tenure.
    -   **15% Education**: Alignment with required academic levels.
    -   **10% Certifications**: Bonus for professional credentials.
    -   **5% Keyword Density**: Statistical presence of critical ecosystem terms.
6.  **Explainable AI (XAI)**: Every match comes with a natural language explanation and a detailed percentage breakdown of the final score.

---

## 🏗️ System Architecture
The system follows a modern decoupled architecture, ensuring high performance and scalability.

```mermaid
graph TD
    A[Frontend: Next.js] -->|API Requests| B[Backend: FastAPI]
    B -->|User Data| C[(PostgreSQL)]
    B -->|Similarity Search| D[(FAISS Vector Store)]
    B -->|NLP Tasks| E[Sentence Transformers]
    style B fill:#f9f,stroke:#333,stroke-width:2px
```

---

## 🛠️ Tech Stack & Infrastructure
- **Backend**: Python (FastAPI), Uvicorn
- **Frontend**: TypeScript, React (Next.js), TailwindCSS
- **Database**: PostgreSQL (Structured Data)
- **Vector DB**: FAISS (High-dimensional Vector Search)
- **AI/ML**: Sentence Transformers, PyTorch, NLTK
- **Containerization**: Docker, Docker Compose

---

## 📂 Project Structure
```bash
├── backend/            # FastAPI Application & AI Logic
├── frontend/           # Next.js Application
├── database/           # SQL Migration Scripts
├── docker/             # Docker Configuration
└── README.md           # Project Documentation

---

## 📡 API Endpoints

### 🔐 Authentication
- `POST /api/v1/auth/signup`: Create a new candidate or recruiter account.
- `POST /api/v1/auth/token`: Login to receive a JWT access token.

### 📄 Resumes & Matching
- `POST /api/v1/resumes/upload-and-match`: End-to-end flow to upload a PDF, parse it, and get an immediate match score against a job.

### 💼 Jobs
- `GET /api/v1/jobs`: List available job postings (Recruiter/Candidate specific).

---
```

---

## 🚦 Getting Started

### 1️⃣ Prerequisites
- Docker & Docker Compose
- Python 3.9+
- Node.js 18+

### 2️⃣ Installation & Setup
1. **Clone the Repository**
   ```bash
   git clone https://github.com/Shrikant-sharma-9/Mini_project_4thsem.git
   cd Antigravity
   ```

2. **Spin up Infrastructure (Optional - Docker)**
   ```bash
   docker-compose up -d
   ```

3. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env      # Configure your environment
   python main.py
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🖼️ Screenshots
| Recruiter Dashboard | Candidate Matching |
| :---: | :---: |
| ![Recruiter Dashboard](./screenshots/recruiter_dashboard.png) | ![Candidate Matching](./screenshots/candidate_matching.png) |

---

## 🛡️ License
This project is licensed under the MIT License - see the LICENSE file for details.

---
Developed with ❤️ by the Hiring Intelligence Team.
