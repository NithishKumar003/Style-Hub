
import sqlite3

database_path = "stylehub.db"

columns_to_add = {
    "payment_status": "VARCHAR(30) NOT NULL DEFAULT 'PENDING'",
    "stripe_payment_intent_id": "VARCHAR(255)",
    "payment_error": "TEXT",
}

connection = sqlite3.connect(database_path)

try:
    existing_columns = {
        row[1]
        for row in connection.execute("PRAGMA table_info(orders)")
    }

    if not existing_columns:
        raise RuntimeError(
            "The orders table was not found. Check the database path."
        )

    for column_name, column_definition in columns_to_add.items():
        if column_name not in existing_columns:
            connection.execute(
                f"ALTER TABLE orders ADD COLUMN {column_name} {column_definition}"
            )
            print(f"Added column: {column_name}")
        else:
            print(f"Already exists: {column_name}")

    connection.commit()
    print("Payment columns migration completed.")

except Exception:
    connection.rollback()
    raise

finally:
    connection.close()