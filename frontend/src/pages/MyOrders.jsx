
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/my-orders/");
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError(
        err.response?.data?.detail || "Unable to load your orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timerId = setTimeout(() => {
        fetchOrders();
    }, 0);

    return () => clearTimeout(timerId);
  }, []);

  function getStatusStyle(status) {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "DELIVERED":
      case "SUCCESS":
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

      case "SHIPPED":
      case "PROCESSING":
        return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

      case "PENDING":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

      case "CANCELLED":
      case "FAILED":
        return "bg-red-50 text-red-700 ring-1 ring-red-200";

      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    }
  }

  function getTrackingSteps(status) {
    const normalizedStatus = status?.toUpperCase();

    const steps = [
      {
        label: "Order Placed",
        description: "Your order was created.",
      },
      {
        label: "Confirmed",
        description: "The store confirmed your order.",
      },
      {
        label: "Shipped",
        description: "Your order is on its way.",
      },
      {
        label: "Delivered",
        description: "Your order has been delivered.",
      },
    ];

    const progressByStatus = {
      PENDING: 0,
      CONFIRMED: 1,
      PROCESSING: 1,
      SHIPPED: 2,
      DELIVERED: 3,
      COMPLETED: 3,
    };

    return {
      steps,
      currentStep: progressByStatus[normalizedStatus] ?? -1,
      isCancelled: ["CANCELLED", "FAILED"].includes(normalizedStatus),
    };
  }

  function formatAmount(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(date) {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function renderTracking(order) {
    const tracking = getTrackingSteps(order.status);

    if (tracking.isCancelled) {
      return (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-bold text-red-700">
            Order {order.status?.toLowerCase()}
          </p>
          <p className="mt-1 text-sm text-red-600">
            Please contact the store if you need assistance with this order.
          </p>
        </div>
      );
    }

    return (
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <h4 className="mb-5 font-bold text-slate-900">Order tracking</h4>

        {tracking.currentStep === -1 ? (
          <p className="text-sm leading-6 text-amber-700">
            Tracking is not available for this status yet. Please check with
            the store for an update.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              {tracking.steps.map((step, index) => {
                const completed = index <= tracking.currentStep;
                const current = index === tracking.currentStep;

                return (
                  <div key={step.label} className="min-w-0">
                    <div
                      className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                        completed
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {completed ? "✓" : index + 1}
                    </div>

                    <p
                      className={`text-sm font-bold ${
                        current
                          ? "text-indigo-700"
                          : completed
                            ? "text-slate-800"
                            : "text-slate-500"
                      }`}
                    >
                      {step.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {step.description}
                    </p>

                    {current && (
                      <span className="mt-2 inline-block rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                        Current status
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
              Tracking reflects the current order status reported by the store.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-800 p-7 text-white shadow-lg sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
            Your account
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                My Orders
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                View your purchases, check order progress, and keep track of
                your shopping history.
              </p>
            </div>

            <Link
              to="/"
              className="inline-flex w-fit items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-indigo-50"
            >
              Continue shopping →
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <p className="mt-4 font-medium text-slate-600">
              Loading your orders...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchOrders}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-4xl">
              🛍️
            </div>

            <h2 className="mt-6 text-2xl font-bold text-slate-900">
              No orders yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              Your order history will appear here after you place your first
              order. Discover something you love at StyleHub.
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Order history
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {orders.length} order{orders.length !== 1 ? "s" : ""} found
                </p>
              </div>

              <button
                type="button"
                onClick={fetchOrders}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
              >
                Refresh orders
              </button>
            </div>

            <div className="space-y-5">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:px-7">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Order number
                      </p>
                      <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                        #{order.id}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Placed on {formatDate(order.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(order.status)}`}
                      >
                        {order.status || "Status unavailable"}
                      </span>

                      {order.payment_status && (
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(order.payment_status)}`}
                        >
                          Payment: {order.payment_status}
                        </span>
                      )}

                      {order.payment_method && (
                        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200">
                          {order.payment_method === "COD"
                            ? "Cash on Delivery"
                            : order.payment_method === "STRIPE"
                              ? "Online Payment"
                              : order.payment_method}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 sm:p-7">
                    {renderTracking(order)}

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Total amount
                        </p>
                        <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                          ₹{formatAmount(order.total_amount)}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-sm font-medium text-slate-500">
                          Order status
                        </p>
                        <p className="mt-2 font-bold text-slate-900">
                          {order.status || "Status unavailable"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Progress updates when the store changes the order
                          status.
                        </p>
                      </div>
                    </div>

                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div className="mt-6 border-t border-slate-100 pt-5">
                        <h4 className="mb-3 text-sm font-bold text-slate-800">
                          Items in this order
                        </h4>

                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div
                              key={`${order.id}-${item.product_id}-${index}`}
                              className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {item.product_name ||
                                    `Product #${item.product_id}`}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Quantity: {item.quantity}
                                </p>
                              </div>

                              <p className="shrink-0 text-sm font-bold text-slate-900">
                                ₹
                                {formatAmount(
                                  Number(item.price_at_purchase) *
                                    Number(item.quantity)
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500">
                        Order #{order.id} · {order.items?.length || 0} item
                        {(order.items?.length || 0) !== 1 ? "s" : ""}
                      </p>

                      <Link
                        to={`/my-orders/${order.id}`}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                      >
                        View order details →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MyOrders;