from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, AliasPath, Field



class OrderItemResponse(BaseModel):
    product_id: int
    product_name: str | None = Field(
        default=None,
        validation_alias=AliasPath("product", "name"),
    )
    quantity: int
    price_at_purchase: Decimal

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: int
    total_amount: Decimal
    status: str
    payment_status: str | None = None
    payment_method: str | None = None
    payment_error: str | None = None
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)