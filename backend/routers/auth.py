from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from jose import JWTError, jwt
import uuid
import random
from datetime import datetime, timedelta

from database import get_db
from models import User, UserRole
from services.auth_service import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM, TokenData
from limiter import limiter

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
    user_id: str

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

class RoleChecker:
    def __init__(self, allowed_roles):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role.value not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Operation not permitted")
        return current_user

@router.post("/signup")
@limiter.limit("5/minute")
def signup(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate Role
    try:
        user_role = UserRole[user.role.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid role. Must be CANDIDATE or RECRUITER")

    # Create user
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

    return {"message": "Account created successfully. You can now log in.", "email": user.email}



@router.post("/token", response_model=Token)
@limiter.limit("10/minute")
def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
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
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value, "user_id": str(user.user_id)}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

@router.post("/request-password-reset")
@limiter.limit("3/minute")
def request_password_reset(request: Request, payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        # Mocking email delivery for password reset link
        reset_token = create_access_token(data={"user_id": str(user.user_id), "type": "reset"}, expires_delta=timedelta(minutes=15))
        # In a real app, send this token via email
        print(f"PASSWORD RESET LINK GENERATED: /reset-password?token={reset_token}")
    return {"message": "If that email is registered, a reset link has been sent."}

@router.post("/reset-password")
@limiter.limit("3/minute")
def reset_password(request: Request, payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    try:
        token_data = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
        if token_data.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token type.")
        user_id = token_data.get("user_id")
        user = db.query(User).filter(User.user_id == uuid.UUID(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
            
        user.password_hash = get_password_hash(payload.new_password)
        db.commit()
        return {"message": "Password has been successfully reset."}
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

