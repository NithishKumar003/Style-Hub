from datetime import datetime, timedelta, timezone

from jose import jwt 
from passlib.context import CryptContext

from app.core.config import settings

password_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password: str) -> str:
    return password_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return password_context.verify(password, hashed_password)

def create_access_token(user_id: int, role: str) -> str:
    expire_time = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    
    token_data = {
        "sub": str(user_id),
        "role": role,
        "exp": expire_time
    }
    
    access_token = jwt.encode(
        token_data,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    
    return access_token