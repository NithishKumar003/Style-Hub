from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse
from app.core.security import hash_password, create_access_token, verify_password
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register")
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email alredy registered"
        )
        
    hashed_password = hash_password(user_data.password)
    
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_password,
        role="CUSTOMER"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return{
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }
    
    
@router.post("/login")
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()
    
    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
        
    password_is_correct = verify_password(
        user_data.password,
        existing_user.hashed_password
    )
    
    if not password_is_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
        
    access_token = create_access_token(
        user_id=existing_user.id,
        role=existing_user.role 
    )
    
    return {
        "message": "Login Successful",
        "access_token": access_token,
        "token_type": "bearer"
    }
    
@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user