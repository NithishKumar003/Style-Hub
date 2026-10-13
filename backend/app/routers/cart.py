from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field 
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.cart import Cart, CartItem
from app.models.user import User
from app.models.product import Product
 
router = APIRouter(prefix="/api/cart", tags=["Cart"])

class UpdateCartItemRequest(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=100)

@router.get("/")
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart = (
        db.query(Cart)
        .filter(Cart.user_id == current_user.id)
        .first()
    )
    
    if cart is None:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.cart_id == cart.id)
        .all()
    )
    
    items = []
    
    for cart_item in cart_items:
        product = cart_item.product
        
        items.append({
            "cart_item_id": cart_item.id,
            "product_id": product.id,
            "product_name": product.name,
            "price": product.price,
            "quantity": cart_item.quantity,
            "subtotal": product.price * cart_item.quantity,
            "image_url": product.image_url,
            "is_active": product.is_active
        })
        
    return{
        "cart_id": cart.id,
        "user_id": cart.user_id,
        "items": items
    }
    
@router.post("/add", status_code=status.HTTP_200_OK)
def add_to_cart(
    request: UpdateCartItemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = (
        db.query(Product)
        .filter(
            Product.id == request.product_id,
            Product.is_active.is_(True)
        )
        .first()
    )
    
    if product is None:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail="Product not found or inactive"
        )
        
    cart = (
        db.query(Cart)
        .filter(Cart.user_id == current_user.id)
        .first()
    )
    
    if cart is None:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.flush()
        
    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == product.id 
        )
        .first()
    )
    
    existing_quantity = cart_item.quantity if cart_item else 0
    new_quantity = existing_quantity + request.quantity
    
    if new_quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {product.stock} units are available"
        )
        
    if cart_item:
        cart_item.quantity = new_quantity
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=request.quantity 
        )
        db.add(cart_item)
        
    try:
        db.commit()
        db.refresh(cart_item)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update cart"
        )
        
    return{
        "message": "Product added to cart successfully",
        "cart_item_id": cart_item.id,
        "product_id": product.id,
        "quantity": cart_item.quantity
    }
    
@router.put("/items/{cart_item_id}")
def update_cart_item(
    cart_item_id: int,
    request: UpdateCartItemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_item = (
        db.query(CartItem)
        .join(Cart, CartItem.cart_id == Cart.id)
        .filter(
            CartItem.id == cart_item_id,
            Cart.user_id == current_user.id 
        )
        .first()
    )
    
    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
        
    product = cart_item.product
    
    if not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This product is no longer available"
        )
        
    if request.quantity > product.stock:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail=f"Only {product.stock} units are available"
        )
        
    cart_item.quantity = request.quantity
    
    db.commit()
    db.refresh(cart_item)
    
    return{
        "message": "Cart quantity updated successfullu",
        "cart_item_id": cart_item.id,
        "product_id": product.id,
        "quantity": cart_item.quantity,
        "subtotal": product.price * cart_item.quantity
    }
    
@router.delete("/items/{cart_item_id}")
def remove_cart_item(
    cart_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_item = (
        db.query(CartItem)
        .join(Cart, CartItem.cart_id == Cart.id)
        .filter(
            CartItem.id == cart_item_id,
            Cart.user_id == current_user.id
        )
        .first()
    )
    
    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
        
    db.delete(cart_item)
    db.commit()
    
    return {
        "message": "Product removed from cart successfully"
    }