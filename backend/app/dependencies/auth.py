from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import get_db
from app.models.user import User 

security = HTTPBearer()

def get_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    return credentials.credentials

def verify_token(token: str):
    try:
        token_data = jwt.decode(
            token,
            settings.secret_key,
            algorithms = [settings.algorithm]
        )
        
        return token_data
    
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
        
def get_current_user(
    token: str = Depends(get_token),
    db: Session = Depends(get_db)
):
    token_data = verify_token(token)
    
    user_id = token_data.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token data"
        )
        
    user = db.query(User).filter(
        User.id == int(user_id)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )
    
    return user

def require_admin(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
        
    return current_user