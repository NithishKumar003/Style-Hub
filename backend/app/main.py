from fastapi import FastAPI

from app.core.config import settings
from app.database.database import Base, engine
from app.models.user import User
from app.models.product import Product
from app.routers.auth import router as auth_router
from app.routers.products import router as products_router
from app.routers.admin import router as admin_router



Base.metadata.create_all(bind=engine)

app = FastAPI(title="Style-Hub API")

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(admin_router)

@app.get('/')
def home():
    return {
        "message": "Welcome to Style-Hub API",
        "algorithm": settings.algorithm,
        "token_expiration": settings.access_token_expire_minutes
    }
