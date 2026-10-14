import stripe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.order import Order 
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.order import OrderItem

router = APIRouter(prefix="/api/payments", tags=["Payments"],)

@router.post("/create-intent/{order_id}")
def create_payment_intent(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe is not configured",
        )
        
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )
    
    if order is None:
        raise HTTPException(status_code=404, detail="Order Not found")
    
    if order.payment_method == "COD":
        raise HTTPException(
            status_code=400,
            detail="This order uses Cash on Delivery and cannot use Stripe payment",
        )
        
    if order.payment_status == "SUCCESS":
        raise HTTPException(
            status_code=400,
            detail="This order has alredy been paid",
        )
        
    if order.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="This order cannot be paid",
        )
        
    if order.stripe_payment_intent_id:
        try:
            stripe.api_key = settings.stripe_secret_key
            existing_intent = stripe.PaymentIntent.retrieve(
                order.stripe_payment_intent_id
            )
            
            if existing_intent.status in {
                "requires_payment_method",
                "requires_confirmation",
                "requires_action",
            }:
                return {
                    "client_secret": existing_intent.client_secret,
                    "order_id": order.id,
                }
                
        except stripe.StripeError as error:
            print("Existing PaymentIntent error:", type(error).__name__, str(error))
            raise HTTPException(
                status_code=502,
                detail="Unable to retrieve the existing Stripe payment",
            )
            
    try:
        stripe.api_key = settings.stripe_secret_key
        amount_in_paise = int(order.total_amount * 100)
        
        if amount_in_paise <=  0:
            raise HTTPException(
                status_code=400,
                detail="Order amount must be grater than zero",
            )
            
        intent = stripe.PaymentIntent.create(
            amount=amount_in_paise,
            currency="inr",
            metadata={
                "order_id": str(order.id),
                "user_id": str(current_user.id),
            },
        )
        
        order.stripe_payment_intent_id = intent.id 
        order.payment_status = "PENDING"
        order.payment_error = None
        db.commit()
        
        return {
            "client_secret": intent.client_secret,
            "order_id": order.id,
        }
        
    except HTTPException:
        db.rollback()
        raise
    
    except stripe.StripeError as error:
        db.rollback()
        print("Stripe error type:", type(error).__name__)
        print("Stripe error message:", str(error))

        raise HTTPException(
            status_code=502,
            detail="Stripe could not create the payment",
        )
        
    except Exception as error:
        import traceback

        db.rollback()
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail="Unable to start payment",
        )
                

@router.post("/confirm/{order_id}")
def confirm_payment(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stripe.api_key = settings.stripe_secret_key

    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )

    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.payment_method == "COD":
        raise HTTPException(
            status_code=400,
            detail="Cash on Delivery orders cannot be confirmed through Stripe",
        )

    # Prevent stock deduction more than once.
    if order.payment_status == "SUCCESS":
        return {
            "message": "Payment already confirmed",
            "order_id": order.id,
            "status": order.status,
            "payment_status": order.payment_status,
        }

    if not order.stripe_payment_intent_id:
        raise HTTPException(
            status_code=400,
            detail="No Stripe payment exists for this order",
        )

    try:
        intent = stripe.PaymentIntent.retrieve(
            order.stripe_payment_intent_id
        )
    except stripe.StripeError:
        raise HTTPException(
            status_code=502,
            detail="Unable to verify payment with Stripe",
        )

    # Verify the payment and its association with this order.
    metadata = intent.metadata.to_dict()

    print("Payment verification details:")
    print("Stripe status:", intent.status)
    print("Stripe order ID:", metadata.get("order_id"))
    print("Database order ID:", order.id)
    print("Stripe user ID:", metadata.get("user_id"))
    print("Logged-in user ID:", current_user.id)
    print("Stripe amount (paise):", intent.amount)
    print("Expected amount (paise):", int(order.total_amount * 100))
    print("Stripe currency:", intent.currency)

    # Verify that this payment belongs to this order and user.
    if (
        metadata.get("order_id") != str(order.id)
        or metadata.get("user_id") != str(current_user.id)
        or intent.amount != int(order.total_amount * 100)
        or intent.currency.lower() != "inr"
    ):
        raise HTTPException(
            status_code=400,
            detail="Stripe payment details do not match this order",
        )

    # Record a failed payment attempt.
    if intent.status == "requires_payment_method":
        order.payment_status = "FAILED"
        order.payment_error = "Payment was declined or an invalid payment method was used"
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Payment failed. Please try another payment method.",
        )

    # Only a successful Stripe payment can finalize an order.
    if intent.status != "succeeded":
        raise HTTPException(
            status_code=400,
            detail="Payment has not succeeded. Please complete the payment first.",
        )

    if order.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="This order cannot be confirmed",
        )

    try:
        order_items = (
            db.query(OrderItem)
            .filter(OrderItem.order_id == order.id)
            .all()
        )

        # Check all items before changing any stock.
        for item in order_items:
            product = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .first()
            )

            if (
                product is None
                or not product.is_active
                or product.stock < item.quantity
            ):
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Stock is no longer available for every item. "
                        "Contact support regarding your successful payment."
                    ),
                )

        # Payment is verified: finalize order and inventory.
        for item in order_items:
            product = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .first()
            )
            product.stock -= item.quantity
            
        order.stock_deducted = True

        # Remove cart contents only if they still match this order.
        cart = (
            db.query(Cart)
            .filter(Cart.user_id == current_user.id)
            .first()
        )

        if cart is not None:
            cart_items = (
                db.query(CartItem)
                .filter(CartItem.cart_id == cart.id)
                .all()
            )

            cart_matches_order = (
                len(cart_items) == len(order_items)
                and all(
                    any(
                        cart_item.product_id == order_item.product_id
                        and cart_item.quantity == order_item.quantity
                        for cart_item in cart_items
                    )
                    for order_item in order_items
                )
            )

            if cart_matches_order:
                for cart_item in cart_items:
                    db.delete(cart_item)

        order.payment_status = "SUCCESS"
        order.payment_error = None
        order.status = "CONFIRMED"

        db.commit()

        return {
            "message": "Payment confirmed successfully",
            "order_id": order.id,
            "status": order.status,
            "payment_status": order.payment_status,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to finalize the paid order",
        )
        

@router.post("/failure/{order_id}")
def record_payment_failure(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe is not configured",
        )

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id,
    ).first()

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    if order.payment_status == "SUCCESS":
        raise HTTPException(
            status_code=400,
            detail="A successful payment cannot be marked as failed",
        )

    if not order.stripe_payment_intent_id:
        raise HTTPException(
            status_code=400,
            detail="No Stripe payment exists for this order",
        )

    try:
        stripe.api_key = settings.stripe_secret_key
        intent = stripe.PaymentIntent.retrieve(
            order.stripe_payment_intent_id
        )
    except stripe.StripeError:
        raise HTTPException(
            status_code=502,
            detail="Unable to verify payment failure with Stripe",
        )

    metadata = intent.metadata.to_dict()

    if (
        metadata.get("order_id") != str(order.id)
        or metadata.get("user_id") != str(current_user.id)
        or intent.amount != int(order.total_amount * 100)
        or intent.currency.lower() != "inr"
    ):
        raise HTTPException(
            status_code=400,
            detail="Stripe payment details do not match this order",
        )

    if intent.status != "requires_payment_method":
        raise HTTPException(
            status_code=400,
            detail="Stripe has not confirmed a failed payment",
        )

    order.payment_status = "FAILED"
    order.payment_error = (
        "Payment was declined or an invalid payment method was used"
    )

    # Empty this user's cart after the failure is verified.
    cart = db.query(Cart).filter(
        Cart.user_id == current_user.id
    ).first()

    if cart:
        db.query(CartItem).filter(
            CartItem.cart_id == cart.id
        ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": "Payment failure recorded and cart cleared",
        "order_id": order.id,
        "payment_status": order.payment_status,
        "cart_cleared": True,
    }
