from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import require_admin
from app.models.product import Product
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate

router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)

@router.get("/", response_model=list[ProductResponse])
def get_products(
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.is_active == True
    ).all()
    
    return products

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product=db.query(Product).filter(
        Product.id == product_id,
        Product.is_active == True
    ).first()
    
    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
        
    return product

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin)
):
    new_product = Product(
        name = product_data.name,
        description=product_data.description,
        price=product_data.price,
        category=product_data.category,
        image_url=product_data.image_url,
        stock=product_data.stock
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return new_product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()
    
    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
        
    update_data = product_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(product, field, value)
        
    db.commit()
    db.refresh(product)
    
    return product

@router.delete("/{product_id}")
def deactivate_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(require_admin)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()
    
    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
        
    product.is_active = False
    db.commit()
    return {
        "message": "Product deactivated successfully",
        "product_id": "product.id"
    }