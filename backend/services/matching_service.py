import logging
import numpy as np
import faiss
import networkx as nx
from typing import Dict, List, Any
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class MatchingService:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        logger.info(f"Loading SentenceTransformer model: {model_name}")
        # 1. Load sentence-transformers model (all-MiniLM-L6-v2)
        self.model = SentenceTransformer(model_name)
        
        # Determine embedding dimension (384 for all-MiniLM-L6-v2)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        
        # 3. Store embeddings in FAISS index
        # Initialize FAISS Index for Inner Product (for Cosine Similarity on normalized vectors)
        self.index = faiss.IndexFlatIP(self.embedding_dim)

        # 4. Initialize Core Skill Graph Inference Engine
        self.skill_graph = self._build_skill_graph()

    def _build_skill_graph(self) -> nx.DiGraph:
        """
        Constructs a directed knowledge graph of skills.
        Edges represent a 'requires' or 'implies' relationship.
        e.g., 'react' -> 'javascript' means knowing React implies knowing JavaScript.
        """
        G = nx.DiGraph()
        
        # Define core hierarchical relationships (Child -> implies -> Parent)
        edges = [
            # JavaScript Ecosystem
            ('react', 'javascript'),
            ('react', 'html'),
            ('react', 'css'),
            ('nextjs', 'react'),
            ('nextjs', 'javascript'),
            ('angular', 'javascript'),
            ('angular', 'typescript'),
            ('vue', 'javascript'),
            ('node', 'javascript'),
            ('typescript', 'javascript'),
            
            # Python Ecosystem
            ('fastapi', 'python'),
            ('django', 'python'),
            ('flask', 'python'),
            ('pandas', 'python'),
            ('machine learning', 'python'),
            
            # Java Ecosystem
            ('spring boot', 'java'),
            ('hibernate', 'java'),
            
            # Cloud & DevOps
            ('kubernetes', 'docker'),
            ('aws', 'cloud computing'),
            ('gcp', 'cloud computing'),
            ('azure', 'cloud computing'),
            ('ci/cd', 'git'),
            
            # Databases
            ('postgresql', 'sql'),
            ('mysql', 'sql'),
            ('mongodb', 'nosql'),
            ('redis', 'nosql')
        ]
        
        G.add_edges_from(edges)
        return G

    def _expand_skills(self, skills: set) -> set:
        """
        Traverses the Knowledge Graph to inject implied skills.
        If a user has ['nextjs'], this expands dynamically to ['nextjs', 'react', 'javascript', 'html', 'css'].
        """
        expanded = set(skills)
        for skill in skills:
            if skill in self.skill_graph:
                # Add all descendants (nodes reachable from this skill)
                implied_skills = nx.descendants(self.skill_graph, skill)
                expanded.update(implied_skills)
        return expanded

    def generate_normalized_embedding(self, text: str) -> np.ndarray:
        """
        Generates and normalizes embeddings for a given text.
        L2 Normalization ensures the Inner Product directly yields the Cosine Similarity.
        """
        if not text.strip():
            return np.zeros((1, self.embedding_dim), dtype=np.float32)

        # 2. Generate embeddings for text
        embedding = self.model.encode([text], convert_to_numpy=True)
        
        # Normalize vectors for cosine similarity
        faiss.normalize_L2(embedding)
        return embedding

    def compute_semantic_similarity(self, resume_text: str, job_text: str) -> float:
        """
        Embeds resume and job texts, stores job in FAISS, and computes semantic similarity.
        """
        if not resume_text or not job_text:
            return 0.0

        resume_emb = self.generate_normalized_embedding(resume_text)
        job_emb = self.generate_normalized_embedding(job_text)

        # 3. Store embeddings in FAISS index (runtime indexing for comparison)
        self.index.reset()          # Ensure index is empty before querying a single job
        self.index.add(job_emb)     # Add the job description vector

        # 4. Compute cosine similarity
        distances, _ = self.index.search(resume_emb, k=1)
        
        # The inner product of L2 normalized vectors is the cosine similarity.
        # It ranges from -1 to +1. We clamp it between 0.0 to 1.0 for scoring.
        similarity = float(distances[0][0])
        return max(0.0, min(1.0, similarity))

    def evaluate_match(self, resume_data: Dict[str, Any], job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates a candidate's resume data against the job requirements.
        Implementation of the weighted scoring formula.
        
        resume_data structure:
        - text: str
        - skills: list[str]
        - experience_years: float/int
        - education_level: int (e.g., scale of 1-5 where 0=none, 1=BSc, 2=MSc, etc.)
        - certifications: list[str]
        
        job_data structure:
        - text: str
        - required_skills: list[str]
        - min_experience_years: float/int
        - min_education_level: int
        - required_certifications: list[str]
        - keywords: list[str] (For keyword density calculation)
        """
        resume_text = resume_data.get("text", "")
        job_text = job_data.get("text", "")
        seniority = resume_data.get("seniority_level", "Unknown")

        # A. Semantic Similarity via FAISS & SentenceTransformers
        semantic_sim = self.compute_semantic_similarity(resume_text, job_text)

        # B. Exact Skill Similarity WITH KNOWLEDGE GRAPH INFERENCE
        r_skills_explicit = {str(s).lower().strip() for s in resume_data.get("skills", [])}
        j_skills = {str(s).lower().strip() for s in job_data.get("required_skills", [])}
        
        # Expand candidate's explicit skills using the NetworkX Graph
        r_skills_inferred = self._expand_skills(r_skills_explicit)
        
        # Calculate matches using the newly inferred superset
        matched_skills = list(j_skills.intersection(r_skills_inferred))
        missing_skills = list(j_skills.difference(r_skills_inferred))
        
        # Identify which skills were magically inferred (for explainability)
        inferred_bonus_skills = list(set(matched_skills) - r_skills_explicit)
        
        # As per formula, mapping skill similarity directly over explicit requirement hits 
        # Output limits between 0.0 and 1.0.
        if j_skills:
            skill_similarity = len(matched_skills) / len(j_skills)
        else:
            # Fallback to pure NLP parsing / context if no explicit structure given
            skill_similarity = semantic_sim

        # C. Experience Score
        r_exp = float(resume_data.get("experience_years", 0))
        j_exp = float(job_data.get("min_experience_years", 0))
        if j_exp > 0:
            experience_score = 1.0 if r_exp >= j_exp else (r_exp / j_exp)
        else:
            experience_score = 1.0

        # D. Education Score
        r_edu = int(resume_data.get("education_level", 0))
        j_edu = int(job_data.get("min_education_level", 0))
        if j_edu > 0:
            education_score = 1.0 if r_edu >= j_edu else (r_edu / j_edu)
        else:
            education_score = 1.0

        # E. Certification Score
        r_certs = {str(c).lower().strip() for c in resume_data.get("certifications", [])}
        j_certs = {str(c).lower().strip() for c in job_data.get("required_certifications", [])}
        
        if j_certs:
            cert_score = len(j_certs.intersection(r_certs)) / len(j_certs)
        else:
            cert_score = 1.0

        # F. Keyword Density Score
        keywords = [str(k).lower().strip() for k in job_data.get("keywords", [])]
        r_text_lower = resume_text.lower()
        
        if keywords:
            found_keywords = sum(1 for k in keywords if k in r_text_lower)
            # Cap density at 1.0
            keyword_density_score = min(1.0, found_keywords / len(keywords))
        else:
            keyword_density_score = 1.0

        # 5. Implement weighted scoring formula
        final_score = (
            0.40 * skill_similarity +
            0.30 * experience_score +
            0.15 * education_score +
            0.10 * cert_score +
            0.05 * keyword_density_score
        )

        # Generate a short explanation
        explanation_parts = []
        if missing_skills:
            explanation_parts.append(f"Missing {len(missing_skills)} required skill(s).")
        else:
            explanation_parts.append("Candidate matches all required explicit skills.")
            
        if inferred_bonus_skills:
            explanation_parts.append(f"AI inferred knowledge of: {', '.join(inferred_bonus_skills)} based on applicant's other skills.")
            
        if r_exp < j_exp:
            explanation_parts.append(f"Short on experience ({r_exp} vs {j_exp} desired years).")
            
        final_explanation = " ".join(explanation_parts)
        if not final_explanation:
            final_explanation = "Candidate is an excellent match."

        # Compute exact score breakdown percentages
        breakdown = {
            "skills_pct": float(round((0.40 * skill_similarity / 0.40) * 100, 1)) if skill_similarity else 0,
            "experience_pct": float(round((0.30 * experience_score / 0.30) * 100, 1)) if experience_score else 0,
            "education_pct": float(round((0.15 * education_score / 0.15) * 100, 1)) if education_score else 0,
            "certification_pct": float(round((0.10 * cert_score / 0.10) * 100, 1)) if cert_score else 0,
            "keywords_pct": float(round((0.05 * keyword_density_score / 0.05) * 100, 1)) if keyword_density_score else 0,
            "semantic_bonus": float(round(semantic_sim * 100, 1))
        }

        # 6. Return structured response
        return {
            "final_score": float(round(final_score, 4)),
            "semantic_similarity": float(round(semantic_sim, 4)),
            "missing_skills": missing_skills,
            "matched_skills": matched_skills,
            "explanation": final_explanation.strip(),
            "score_breakdown": breakdown,
            "seniority_level": seniority
        }
