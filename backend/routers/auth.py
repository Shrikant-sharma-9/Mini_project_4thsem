from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from jose import JWTError, jwt
import uuid

from database import get_db
from models import User, UserRole
from services.auth_service import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM, TokenData

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str # "CANDIDATE" or "RECRUITER"

class UserResponse(BaseModel):
    user_id: str
    email: str
    first_name: str
    last_name: str
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id, role=payload.get("role"))
    except JWTError:
        raise credentials_exception
    
    try:
        user_uuid = uuid.UUID(token_data.user_id)
    except ValueError:
        raise credentials_exception

    user = db.query(User).filter(User.user_id == user_uuid).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate Role
    try:
        user_role = UserRole[user.role.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid role. Must be CANDIDATE or RECRUITER")

    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user_role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate Token
    access_token = create_access_token(data={"user_id": str(new_user.user_id), "role": new_user.role.value})
    return {"access_token": access_token, "token_type": "bearer", "role": new_user.role.value}

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not registered",
        )
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )
    
    access_token = create_access_token(data={"user_id": str(user.user_id), "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
