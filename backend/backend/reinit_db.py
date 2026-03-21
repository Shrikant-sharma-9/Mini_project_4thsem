from database import init_db
from models import User, UserRole
from database import SessionLocal
from services.auth_service import get_password_hash

# Force SQLite initialization with new models
init_db()

print('Database re-initialized.')
