from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict

class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str = Field(min_length = 5)
    price : Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    category: str = Field(min_length=2, max_length=100)
    image_url : str | None = Field(default=None, max_length=500)
    stock: int = Field(default=0, ge=0)
    
class ProductUpdate(BaseModel):
    name : str | None = Field(default=None, min_length=2, max_length=150)
    description : str | None = Field(default=None, min_length=5)
    price : Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    category : str | None = Field(default=None, min_length=2, max_length=100)
    image_url : str | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)
    is_active: bool| None = None
    
class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    description: str
    price: Decimal
    category: str
    image_url: str | None
    stock: int
    is_active: bool
    created_at: datetime