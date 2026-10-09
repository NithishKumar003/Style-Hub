from sqlalchemy import inspect
from app.database.database import engine

inspector = inspect(engine)
table_names = inspector.get_table_names()
print("Database tables:", table_names)
if "products" in table_names:
    print("SUCCESS: Products table exists")
else:
    print("ERROR: Products table was not created")