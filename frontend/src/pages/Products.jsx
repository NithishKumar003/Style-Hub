
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await api.get("/api/products/");
        setProducts(response.data);
      } catch (error) {
        console.error("Products loading error:", error);
        setError("Unable to load products. Please check the backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  async function handleAddToCart(productId) {
    if (!user) {
      navigate("/login");
      return;
    }

    setCartMessage("");
    setAddingProductId(productId);

    try {
      await api.post("/api/cart/add", {
        product_id: productId,
        quantity: 1,
      });

      setCartMessage("Product added to your cart!");
    } catch (error) {
      console.error("Add to cart error:", error);

      const detail = error.response?.data?.detail;
      setCartMessage(
        typeof detail === "string"
          ? detail
          : "Unable to add product to cart. Please try again."
      );
    } finally {
      setAddingProductId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-10 rounded-2xl bg-gradient-to-r from-gray-950 via-gray-900 to-indigo-950 px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-300">
            New season, new style
          </p>

          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Find your style. Wear your confidence.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-gray-300 sm:text-base">
            Discover your favourites from the StyleHub collection and bring
            something new to your wardrobe.
          </p>

          <a
            href="#products"
            className="mt-6 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-bold text-gray-900 transition hover:bg-indigo-100"
          >
            Explore Collection
          </a>
        </section>

        <section id="products">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                Curated for you
              </p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                Explore Our Collection
              </h2>
            </div>

            {user && (
              <Link
                to="/cart"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View Cart →
              </Link>
            )}
          </div>

          {cartMessage && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-medium text-indigo-800"
            >
              {cartMessage}
              {cartMessage === "Product added to your cart!" && (
                <Link to="/cart" className="ml-2 underline">
                  View cart
                </Link>
              )}
            </div>
          )}

          {loading && (
            <p className="py-12 text-center text-gray-500">
              Loading products...
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-700"
            >
              {error}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <h3 className="text-lg font-semibold">No products available</h3>
              <p className="mt-2 text-sm text-gray-500">
                Please check back soon for new arrivals.
              </p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className="flex h-64 items-center justify-center overflow-hidden bg-gray-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-sm text-gray-400">
                        No image available
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {product.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
                      {product.description ||
                        "Discover this item from StyleHub."}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xl font-bold text-indigo-600">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.stock > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.stock > 0 ? "In stock" : "Out of stock"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={
                        addingProductId === product.id || product.stock <= 0
                      }
                      className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addingProductId === product.id
                        ? "Adding..."
                        : product.stock <= 0
                          ? "Out of Stock"
                          : "Add to Cart"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Products;