from database import init_db
from models import User, UserRole
from database import SessionLocal
from services.auth_service import get_password_hash

# Force SQLite initialization
init_db()

db = SessionLocal()
email = 'shrikantsharma20052005@gmail.com'

# Check if user already exists
if not db.query(User).filter(User.email == email).first():
    new_user = User(
        email=email,
        password_hash=get_password_hash('123'),
        first_name='Shrikant',
        last_name='Sharma',
        role=UserRole.CANDIDATE
    )
    db.add(new_user)
    db.commit()
    print('User generated and verified.')
else:
    print('User already exists.')
