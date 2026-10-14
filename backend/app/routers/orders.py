from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Literal

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.models.product  import Product
from app.models.user import User
from app.schemas.order import OrderResponse

router = APIRouter(tags=["Orders"])


@router.post(
    "/api/orders/create",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    payment_method: Literal["STRIPE", "COD"] = "STRIPE",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        cart = (
            db.query(Cart)
            .filter(Cart.user_id == current_user.id)
            .first()
        )

        if cart is None:
            raise HTTPException(
                status_code=400,
                detail="Your cart is empty",
            )

        cart_items = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id)
            .all()
        )

        if not cart_items:
            raise HTTPException(
                status_code=400,
                detail="Your cart is empty",
            )

        total_amount = 0
        order_items_data = []

        for cart_item in cart_items:
            product = (
                db.query(Product)
                .filter(Product.id == cart_item.product_id)
                .first()
            )

            if product is None or not product.is_active:
                raise HTTPException(
                    status_code=400,
                    detail="A product in your cart is unavailable",
                )

            if cart_item.quantity > product.stock:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}",
                )

            total_amount += product.price * cart_item.quantity

            order_items_data.append({
                "product": product,
                "quantity": cart_item.quantity,
                "price": product.price,
            })

        new_order = Order(
            user_id=current_user.id,
            total_amount=total_amount,
            status="PENDING",
            payment_status="PENDING",
            payment_method=payment_method,
        )

        db.add(new_order)
        db.flush()

        for item_data in order_items_data:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item_data["product"].id,
                quantity=item_data["quantity"],
                price_at_purchase=item_data["price"],
            )
            db.add(order_item)

        if payment_method == "COD":
            for item_data in order_items_data:
                product = item_data["product"]
                product.stock -= item_data["quantity"]
                
            new_order.stock_deducted = True
                
            for cart_item in cart_items:
                db.delete(cart_item)
                
        db.commit()
        db.refresh(new_order)

        return new_order

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create your order",
        )
        
               
@router.get("/api/my-orders/", response_model=list[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    
    return orders