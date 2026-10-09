from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text
from app.database.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Numeric(10,2), nullable=False)
    category = Column(String(100), nullable=False)
    image_url = Column(String(500), nullable=True)
    stock = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )