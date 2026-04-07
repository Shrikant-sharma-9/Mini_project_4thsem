import re
import pdfplumber
import docx
import logging
from typing import List, Dict, Any, Optional
from io import BytesIO
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Will fail gracefully if model hasn't finished downloading yet
    nlp = None

logger = logging.getLogger(__name__)

# Predefined dictionary mapping common technical skills and their variants
SKILL_DICTIONARY = {
    "python", "fastapi", "react", "java", "sql", "docker", "kubernetes",
    "javascript", "typescript", "node", "aws", "gcp", "azure", "ci/cd",
    "machine learning", "mongodb", "postgresql", "redis", "c++", "c#", "go",
    "rust", "nextjs", "vue", "angular", "html", "css", "git", "linux"
}

# Common certification abbreviations/names
CERT_DICTIONARY = {
    "aws certified", "pmp", "csm", "cissp", "ceh", "comptia",
    "google cloud professional", "cka", "ckad", "azure solutions architect",
    "ccna", "ccnp"
}

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts raw text from a PDF file in memory.
    """
    text_content = []
    try:
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted_page_text = page.extract_text()
                if extracted_page_text:
                    text_content.append(extracted_page_text)
                    
        full_text = "\n".join(text_content)
        # PostgreSQL cannot store NUL (0x00) characters in string literals
        sanitized_text = full_text.replace('\x00', '')
        # Apply Bias Mitigation Redaction
        mitigated_text = apply_bias_mitigation(sanitized_text)
        return mitigated_text
    except Exception as e:
        logger.error(f"Failed to parse PDF: {str(e)}")
        raise ValueError("Invalid or corrupted PDF file.")

def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extracts raw text from a DOCX file in memory.
    """
    try:
        doc = docx.Document(BytesIO(file_bytes))
        full_text = "\n".join([para.text for para in doc.paragraphs])
        sanitized_text = full_text.replace('\x00', '')
        mitigated_text = apply_bias_mitigation(sanitized_text)
        return mitigated_text
    except Exception as e:
        logger.error(f"Failed to parse DOCX: {str(e)}")
        raise ValueError("Invalid or corrupted DOCX file.")

def apply_bias_mitigation(text: str) -> str:
    """
    Strips potential bias identifiers (names, ages, genders, origins) before AI sees the text.
    Uses regex substitution for common PII patterns and explicit bias-trigger keywords.
    """
    # 1. Redact explicit gender/age/origin keywords to enforce blind filtering
    bias_keywords = [
        r'\bhe\b', r'\bhis\b', r'\bhim\b', r'\bshe\b', r'\bhers\b', r'\bher\b', 
        r'\bboy\b', r'\bgirl\b', r'\bnationality\b', r'\bmarital status\b', 
        r'\bdate of birth\b', r'\bage\b', r'\bgender\b', r'\bsex\b',
        r'\bcaucasian\b', r'\basian\b', r'\bafrican\b', r'\bhispanic\b'
    ]
    
    redacted = text
    for keyword in bias_keywords:
        redacted = re.sub(keyword, '[REDACTED]', redacted, flags=re.IGNORECASE)
        
    return redacted

def extract_skills(text: str) -> List[str]:
    """
    Extracts skills through a Hybrid Engine: 
    1. Exact matching bounded by predefined SKILL_DICTIONARY
    2. Dynamic ML Named Entity Recognition (NER) capturing unseen proper frameworks.
    """
    text_lower = text.lower()
    found_skills = set()
    
    # Simple word boundary regex search for the strict known dictionary
    for skill in SKILL_DICTIONARY:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.add(skill)
            
    # Dynamic NER Inference pulling untracked frameworks
    if nlp is not None:
        doc = nlp(text)
        for ent in doc.ents:
            # Technology names notoriously fall under these entity categories in generalized NERs
            if ent.label_ in ['ORG', 'PRODUCT']:
                clean_ent = ent.text.lower().strip()
                # Bounding basic noise heuristics (not a single letter, not a full paragraph)
                if 2 < len(clean_ent) < 25 and not any(char.isdigit() for char in clean_ent):
                    found_skills.add(clean_ent)
                    
    return sorted(list(found_skills))

def extract_experience_years(text: str) -> float:
    """
    Detects years of experience using regex heuristically.
    Examples: "3 years", "5+ years", "10 yrs of experience"
    """
    text_lower = text.lower()
    
    # Matches patterns like: "5 years", "3+ yrs", "1.5 years"
    pattern = r'(\d+\.?\d*)\+?\s*(?:years?|yrs?)'
    
    matches = re.findall(pattern, text_lower)
    if matches:
        try:
            # We assume the maximum explicit year mention corresponds to total experience
            years = [float(match) for match in matches]
            # Filter out unrealistic years (e.g. someone saying "2020 years")
            valid_years = [y for y in years if 0 < y < 50]
            if valid_years:
                return max(valid_years)
        except ValueError:
            pass
            
    return 0.0

def extract_education_level(text: str) -> int:
    """
    Infers education level based on text keywords.
    0 = None/High School, 1 = BSc/BA, 2 = MSc/MA, 3 = PhD/Doctorate
    Uses highest matched level.
    """
    text_lower = text.lower()
    
    phd_patterns = [r'\bphd\b', r'\bdoctorate\b', r'\bph\.d\b', r'\bph\.d\.\b']
    msc_patterns = [r'\bmsc\b', r'\bmaster', r'\bma\b', r'\bm\.s\b', r'\bm\.a\b', r'\bmba\b', r'\bm\.tech\b', r'\bmtech\b']
    bsc_patterns = [r'\bbsc\b', r'\bbachelor', r'\bba\b', r'\bb\.s\b', r'\bb\.a\b', r'\bb\.tech\b', r'\bbtech\b', r'\bb\.e\b', r'\bbe\b']
    
    if any(re.search(p, text_lower) for p in phd_patterns):
        return 3
    if any(re.search(p, text_lower) for p in msc_patterns):
        return 2
    if any(re.search(p, text_lower) for p in bsc_patterns):
        return 1
        
    return 0

def extract_certifications(text: str) -> List[str]:
    """
    Extracts common certifications based on a keyword dictionary.
    """
    text_lower = text.lower()
    found_certs = set()
    
    for cert in CERT_DICTIONARY:
        if cert in text_lower:
            found_certs.add(cert)
            
    return sorted(list(found_certs))

def infer_seniority_level(text: str, experience_years: float) -> str:
    """
    Deduces the candidate's seniority level based on years of experience and keywords.
    Levels: Entry, Mid-Level, Senior, Lead/Executive
    """
    text_lower = text.lower()
    
    # 1. Check for explicit strong executive/lead keywords
    exec_patterns = [r'\bchief\b', r'\bvp\b', r'\bhead of\b', r'\bdirector\b']
    if any(re.search(p, text_lower) for p in exec_patterns) or experience_years >= 10.0:
        return "Lead/Executive"
        
    # 2. Check for senior management/lead keywords
    lead_patterns = [r'\blead\b', r'\bprincipal\b', r'\bmanager\b', r'\bsenior\b']
    if any(re.search(p, text_lower) for p in lead_patterns) or experience_years >= 5.0:
        return "Senior"
        
    # 3. Check for mid-level status
    if experience_years >= 2.0:
        return "Mid-Level"
        
    # 4. Fallback to Entry
    return "Entry"

def parse_resume(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Orchestrates the full parsing flow: 
    1. Extract text from PDF or DOCX
    2. Analyze text for structured entities
    """
    filename_lower = filename.lower()
    if filename_lower.endswith(".pdf"):
        full_text = extract_text_from_pdf(file_bytes)
    elif filename_lower.endswith(".docx"):
        full_text = extract_text_from_docx(file_bytes)
    else:
        raise ValueError("Unsupported file format. Please upload PDF or DOCX.")
    
    if not full_text:
        raise ValueError("No text could be extracted from the file.")

    skills = extract_skills(full_text)
    exp = extract_experience_years(full_text)
    edu = extract_education_level(full_text)
    certs = extract_certifications(full_text)
    
    # Advanced: Infer Seniority
    seniority = infer_seniority_level(full_text, exp)

    return {
        "text": full_text,
        "skills": skills,
        "experience_years": exp,
        "education_level": edu,
        "certifications": certs,
        "seniority_level": seniority
    }
