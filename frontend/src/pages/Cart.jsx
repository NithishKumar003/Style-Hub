import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { useAuth } from "../context/useAuth";

import api from "../api/axios";
import StripeCheckout from "../components/StripeCheckout";
import stripePromise from "../stripe";
import Header from "../components/Header";
import Footer from "../components/Footer";

const LEGACY_PENDING_ORDER_KEY = "stylehub_pending_stripe_order_id";

function getPendingOrderKey(userId) {
  return userId
    ? `stylehub_pending_stripe_order_id_user_${userId}`
    : null;
}

function getSavedPendingOrderId(userId) {
  const key = getPendingOrderKey(userId);

  if (!key) {
    return null;
  }

  const savedOrderId = sessionStorage.getItem(key);

  if (savedOrderId && /^\d+$/.test(savedOrderId)) {
    return Number(savedOrderId);
  }

  sessionStorage.removeItem(key);
  return null;
}

function Cart() {
  const { user } = useAuth();
  const userId = user?.id;
  const pendingOrderKey = getPendingOrderKey(userId);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("STRIPE");
  const [paymentDetails, setPaymentDetails] = useState(null);

  function savePendingOrderId(orderId) {
    if (!pendingOrderKey) {
        return;
    }

    setPendingOrderId(orderId);
    sessionStorage.setItem(pendingOrderKey, String(orderId));
  }

  function clearPendingOrderId() {
    if (pendingOrderKey) {
        sessionStorage.removeItem(pendingOrderKey);
    }

    sessionStorage.removeItem(LEGACY_PENDING_ORDER_KEY);
    setPendingOrderId(null);
  }

  async function fetchCart() {
    try {
      setError("");
      const response = await api.get("/api/cart/");
      setCart(response.data);
    } catch (error) {
      console.error("Cart loading error:", error);
      setError("Unable to load your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timerId = setTimeout(() => {
        fetchCart();
    }, 0);

    return () => clearTimeout(timerId);
  }, []);

  useEffect(() => {
    setPendingOrderId(getSavedPendingOrderId(userId));
  }, [userId]);

  async function handleUpdateQuantity(item, newQuantity) {
    if (newQuantity < 1) return;

    try {
      setMessage("");

      await api.put(`/api/cart/items/${item.cart_item_id}`, {
        product_id: item.product_id,
        quantity: newQuantity,
      });

      // Cart changed: do not reuse an order created for older quantities.
      clearPendingOrderId();

      await fetchCart();
      setMessage("Cart quantity updated successfully.");
    } catch (error) {
      console.error("Quantity update error:", error);

      const detail = error.response?.data?.detail;
      setMessage(
        typeof detail === "string"
          ? detail
          : "Unable to update quantity. Please try again."
      );
    }
  }

  async function handleRemoveItem(item) {
    try {
      setMessage("");

      await api.delete(`/api/cart/items/${item.cart_item_id}`);

      // Cart changed: a new order may be needed for the remaining items.
      clearPendingOrderId();

      await fetchCart();
      setMessage("Product removed from your cart.");
    } catch (error) {
      console.error("Remove cart item error:", error);

      const detail = error.response?.data?.detail;
      setMessage(
        typeof detail === "string"
          ? detail
          : "Unable to remove product. Please try again."
      );
    }
  }

  async function handleCheckout() {

    if (!userId || !pendingOrderKey) {
        setMessage("Please wait for your account to load, then try checkout again.");
        return;
    }
    try {
      setCheckoutLoading(true);
      setMessage("");
      setError("");

      // Cash on Delivery
      if (paymentMethod === "COD") {
        const orderResponse = await api.post(
          "/api/orders/create",
          null,
          {
            params: {
              payment_method: "COD",
            },
          }
        );

        const orderId = orderResponse.data.id;

        clearPendingOrderId();
        setPaymentDetails(null);

        setMessage(
          `COD order placed successfully! Order #${orderId}. Pay when your order arrives.`
        );

        await fetchCart();
        return;
      }

      // Stripe: reuse the pending order after a failed or cancelled attempt.
      let orderId = pendingOrderId;

      if (!orderId) {
        const orderResponse = await api.post(
          "/api/orders/create",
          null,
          {
            params: {
              payment_method: "STRIPE",
            },
          }
        );

        orderId = orderResponse.data.id;
        savePendingOrderId(orderId);
      }

      const paymentResponse = await api.post(
        `/api/payments/create-intent/${orderId}`
      );

      const clientSecret = paymentResponse.data.client_secret;

      if (!clientSecret) {
        throw new Error("Stripe did not return a payment client secret.");
      }

      setPaymentDetails({
        orderId,
        clientSecret,
      });
    } catch (error) {
      console.error("Checkout error:", error);

      const detail = error.response?.data?.detail || error.message;

      setMessage(
        typeof detail === "string"
          ? detail
          : "Unable to start checkout. Please try again."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePaymentSuccess(orderId) {
    clearPendingOrderId();
    setPaymentDetails(null);
    setMessage(`Payment successful! Order #${orderId} is confirmed.`);

    await fetchCart();
  }

  async function handlePaymentFailure() {
    clearPendingOrderId();
    setPaymentDetails(null);
    setPaymentMethod("STRIPE");
    setMessage(
        "Payment failed. Your cart has been cleared. Please add products again to place a new order."
    );
    await fetchCart();
  }

  function handlePaymentCancel() {
    // Keep the order ID so the customer can retry without creating
    // another order for the same unchanged cart.
    setPaymentDetails(null);
    setMessage(
      "Payment cancelled or unsuccessful. Your cart is unchanged. You can retry payment."
    );
  }

  const totalAmount =
    cart?.items?.reduce(
      (total, item) => total + Number(item.subtotal),
      0
    ) || 0;

  const totalItems =
    cart?.items?.reduce(
      (total, item) => total + Number(item.quantity),
      0
    ) || 0;

  const hasUnavailableProducts =
    cart?.items?.some((item) => !item.is_active) || false;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Your selections
          </p>

          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your Shopping Cart
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
            Review your selected products before checkout.
          </p>
        </section>

        {message && (
          <div
            role="status"
            className={`mb-6 rounded-xl border p-4 ${
              message.includes("successfully") ||
              message.includes("updated successfully") ||
              message.includes("removed from your cart")
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <p className="font-semibold">
              {message.includes("Payment successful")
                ? "Payment completed"
                : message.includes("COD order placed")
                  ? "Order placed"
                  : "Cart update"}
            </p>
            <p className="mt-1 text-sm">{message}</p>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <p className="text-gray-500">Loading your cart...</p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchCart}
              className="mt-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && cart?.items?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-8 w-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6"
                />
                <circle cx="10" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Your cart is empty
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Browse our collection and add something you love.
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Explore Products
            </Link>
          </div>
        )}

        {!loading && !error && cart?.items?.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
            <section
              className="space-y-5 lg:col-span-2"
              aria-label="Cart products"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Cart Items</h2>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              </div>

              {cart.items.map((item) => (
                <article
                  key={item.cart_item_id}
                  className="group flex flex-col gap-5 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-md sm:flex-row sm:p-5"
                >
                  <div className="flex h-52 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:h-36 sm:w-36">
                    {item.image_url && item.image_url !== "string" ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        loading="lazy"
                        className="h-full w-full object-cover"
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

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {item.product_name}
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                          Unit price: ₹
                          {Number(item.price).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <p className="text-xl font-extrabold text-indigo-600">
                        ₹{Number(item.subtotal).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          Quantity
                        </span>

                        <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.product_name}`}
                            onClick={() =>
                              handleUpdateQuantity(item, item.quantity - 1)
                            }
                            disabled={
                              item.quantity <= 1 ||
                              Boolean(paymentDetails) ||
                              checkoutLoading
                            }
                            className="px-3 py-2 font-semibold transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            −
                          </button>

                          <span className="min-w-10 px-2 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.product_name}`}
                            onClick={() =>
                              handleUpdateQuantity(item, item.quantity + 1)
                            }
                            disabled={
                              Boolean(paymentDetails) || checkoutLoading
                            }
                            className="px-3 py-2 font-semibold transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item)}
                        disabled={
                          Boolean(paymentDetails) || checkoutLoading
                        }
                        className="text-sm font-semibold text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove item
                      </button>
                    </div>

                    {!item.is_active && (
                      <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        This product is currently unavailable.
                      </p>
                    )}
                  </div>
                </article>
              ))}

              <div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                  <span aria-hidden="true">←</span>
                  Continue shopping
                </Link>
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                Checkout
              </p>

              <h2 className="mt-1 text-xl font-extrabold">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between gap-4 text-gray-600">
                  <span>Total products</span>
                  <span className="font-semibold text-gray-900">
                    {cart.items.length}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-gray-600">
                  <span>Total quantity</span>
                  <span className="font-semibold text-gray-900">
                    {totalItems}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-t border-gray-200 pt-4">
                  <span className="font-bold text-gray-900">
                    Total amount
                  </span>

                  <span className="text-xl font-extrabold text-indigo-600">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {!paymentDetails && (
                <>
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="mb-3 font-bold">
                      Choose Payment Method
                    </h3>

                    <label
                      className={`mb-3 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        paymentMethod === "STRIPE"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-200"
                      } ${
                        checkoutLoading
                          ? "cursor-not-allowed opacity-60"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="STRIPE"
                        checked={paymentMethod === "STRIPE"}
                        onChange={() => setPaymentMethod("STRIPE")}
                        disabled={checkoutLoading}
                        className="mt-1 accent-indigo-600"
                      />

                      <span>
                        <span className="block font-semibold text-gray-900">
                          Pay Online
                        </span>

                        <span className="mt-1 block text-sm leading-5 text-gray-500">
                          Secure card payment with Stripe.
                        </span>
                      </span>
                    </label>

                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        paymentMethod === "COD"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-200"
                      } ${
                        checkoutLoading
                          ? "cursor-not-allowed opacity-60"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        disabled={checkoutLoading}
                        className="mt-1 accent-indigo-600"
                      />

                      <span>
                        <span className="block font-semibold text-gray-900">
                          Cash on Delivery
                        </span>

                        <span className="mt-1 block text-sm leading-5 text-gray-500">
                          Pay when your order arrives.
                        </span>
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={
                      checkoutLoading ||
                      cart.items.length === 0 ||
                      hasUnavailableProducts
                    }
                    onClick={handleCheckout}
                    className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkoutLoading
                      ? "Preparing Checkout..."
                      : paymentMethod === "COD"
                        ? "Place COD Order"
                        : pendingOrderId
                          ? "Retry Online Payment"
                          : "Proceed to Checkout"}
                  </button>

                  {hasUnavailableProducts && (
                    <p className="mt-3 text-center text-xs text-red-600">
                      Remove unavailable products before checkout.
                    </p>
                  )}

                  <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                    Your order total is calculated from your cart items.
                  </p>
                </>
              )}

              {paymentDetails && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: paymentDetails.clientSecret,
                    }}
                  >
                    <StripeCheckout
                      orderId={paymentDetails.orderId}
                      clientSecret={paymentDetails.clientSecret}
                      onSuccess={handlePaymentSuccess}
                      onFailure={handlePaymentFailure}
                      onCancel={handlePaymentCancel}
                    />
                  </Elements>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Cart;