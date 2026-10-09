
from getpass import getpass

from app.database.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password


admin_name = input("Enter admin name: ").strip()
admin_email = input("Enter admin email: ").strip().lower()
admin_password = getpass("Enter admin password: ")

if not admin_name or not admin_email:
    print("Name and email are required.")
    raise SystemExit(1)

if len(admin_password) < 8:
    print("Password must contain at least 8 characters.")
    raise SystemExit(1)

db = SessionLocal()

try:
    existing_user = (
        db.query(User)
        .filter(User.email == admin_email)
        .first()
    )

    if existing_user:
        print("A user with this email already exists.")
        print("No changes were made.")
    else:
        admin_user = User(
            name=admin_name,
            email=admin_email,
            hashed_password=hash_password(admin_password),
            role="ADMIN"
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("Admin created successfully.")
        print("Admin ID:", admin_user.id)
        print("Admin Email:", admin_user.email)
        print("Admin Role:", admin_user.role)

except Exception:
    db.rollback()
    raise

finally:
    db.close()