from app.database.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

db = SessionLocal()

admin_user = User(
    name="Admin",
    email="5633nithi@gmail.com",
    hashed_password=hash_password("Admin123"),
    role="ADMIN"
)

db.add(admin_user)
db.commit()
db.refresh(admin_user)

print("Admin created successfully")
print("Admin ID:", admin_user.id)
print("Admin Email:", admin_user.email)
print("Admin Role:", admin_user.role)

db.close()