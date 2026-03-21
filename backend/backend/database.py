from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
import os

# Force SQLite since Postgres isn't running and env vars might be stale
DATABASE_URL = "sqlite:///./hiring_intelligence.db"

# Add connect_args for SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import text

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Safe fix for existing SQLite databases missing columns
    if DATABASE_URL.startswith("sqlite"):
        try:
            with engine.connect() as conn:
                # Check if match_threshold exists in jobs table
                result_jobs = conn.execute(text("PRAGMA table_info(jobs)")).fetchall()
                columns_jobs = [row[1] for row in result_jobs]
                if "match_threshold" not in columns_jobs:
                    conn.execute(text("ALTER TABLE jobs ADD COLUMN match_threshold NUMERIC(3, 2) DEFAULT 0.60"))
                    conn.commit()
        except Exception as e:
            print(f"Error migrating database: {e}")
