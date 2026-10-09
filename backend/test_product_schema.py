from app.schemas.product import ProductCreate

valid_product = ProductCreate(
    name="Classic cotton T-Shitrt",
    description="Comfortable cotton T-shirt for everyday wear.",
    price="799.00",
    category="T-shirts",
    image_url=None,
    stock=10
)

print("valid Product accepted")
print("Name:", valid_product.name)
print("Price:", valid_product.price)
print("Stock:", valid_product.stock)

try:
    ProductCreate(
        name="Bad Product",
        description="This product has an invalid price",
        price="-100",
        category="T-shirts",
        stock=-5
    )
except ValueError as error:
    print("\nInvalid product rejected successfully")
    print(error)
    