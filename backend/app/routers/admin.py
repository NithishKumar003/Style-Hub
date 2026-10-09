from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import require_admin
from app.models.product import Product
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Dashboard"]
)

@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin)
):
    total_products = db.query(Product).count()
    
    active_products = db.query(Product).filter(
        Product.is_active == True
    ).count()
    
    inactive_products = total_products - active_products
    
    return {
        "total_products": total_products,
        "active_products": active_products,
        "inactive_products": inactive_products
    }
    
@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin)
):
    users = db.query(User).order_by(User.id.asc()).all()
    
    return users