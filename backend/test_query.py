import uuid
import traceback
from database import SessionLocal
from services.candidate_service import CandidateService
from services.matching_service import MatchingService

db = SessionLocal()
cs = CandidateService(db, MatchingService())

try:
    print(cs.get_applications('04b17f04756a41b38dc04fa85f9b4d99'))
except Exception as e:
    with open('error_log.txt', 'w', encoding='utf-8') as f:
        traceback.print_exc(file=f)
