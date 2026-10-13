from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

class OrderItemResponse(BaseModel):
    product_id: int
    quantity: int
    price_at_purchase: Decimal
    model_config = ConfigDict(from_attributes=True)
    
class OrderResponse(BaseModel):
    id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    items: list[OrderItemResponse]
    model_config = ConfigDict(from_attributes=True)