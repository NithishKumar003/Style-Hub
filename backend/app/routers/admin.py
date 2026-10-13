from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.database import get_db
from app.dependencies.auth import require_admin
from app.models.product import Product
from app.models.user import User
from app.models.order import Order, OrderItem
from app.schemas.user import UserResponse

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Dashboard"]
)

class OrderStatusUpdate(BaseModel):
    status: str

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

@router.get("/orders")
def get_all_orders(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .all()
    )

    result = []

    for order in orders:
        order_items = (
            db.query(OrderItem)
            .filter(OrderItem.order_id == order.id)
            .all()
        )

        items = []

        for item in order_items:
            items.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price_at_purchase": item.price_at_purchase
            })

        result.append({
            "id": order.id,
            "user_id": order.user_id,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at,
            "items": items
        })

    return result

@router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    request: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    allowed_statuses = {
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED"
    }

    new_status = request.status.upper()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status"
        )

    try:
        order = (
            db.query(Order)
            .filter(Order.id == order_id)
            .with_for_update()
            .first()
        )

        if order is None:
            raise HTTPException(
                status_code=404,
                detail="Order not found"
            )

        if order.status == "CANCELLED":
            raise HTTPException(
                status_code=400,
                detail="Cancelled orders cannot be changed"
            )

        if order.status == "DELIVERED":
            raise HTTPException(
                status_code=400,
                detail="Delivered orders cannot be changed"
            )

        allowed_transactions = {
            "PENDING": {"CONFIRMED", "CANCELLED"},
            "CONFIRMED": {"PROCESSING", "CANCELLED"},
            "PROCESSING": {"SHIPPED", "CANCELLED"},
            "SHIPPED": {"DELIVERED"},
            "DELIVERED": set(),
            "CANCELLED": set()
        }

        if new_status not in allowed_transactions.get(order.status, set()):
            raise HTTPException(
                status_code=400,
                detain=f"Invalid status transaction from {order.status} to {new_status}"
            )

        if new_status == "CANCELLED":
            if order.status == "SHIPPED":
                raise HTTPException(
                    status_code=400,
                    detail="Shipped orders cannot be cancelled"
                )

            order_items = (
                db.query(OrderItem)
                .filter(OrderItem.order_id == order.id)
                .all()
            )

            for item in order_items:
                product = (
                    db.query(Product)
                    .filter(Product.id == item.product_id)
                    .with_for_update()
                    .first()
                )

                if product is not None:
                    product.stock += item.quantity

        order.status = new_status
        db.commit()

        return {
            "message": "Order status updated successfully",
            "order_id": order.id,
            "status": order.status
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update order status"
        )

@router.get("/orders/{order_id}")
def get_order_details(
    order_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    order_items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order.id)
        .all()
    )

    items = []

    for item in order_items:
        items.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price_at_purchase": item.price_at_purchase,
            "subtotal": item.price_at_purchase * item.quantity
        })

    return {
        "id": order.id,
        "user_id": order.user_id,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "items": items
    }
