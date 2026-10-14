
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

function OrderDetails() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchOrder() {
      setLoading(true);
      setError("");
      setOrder(null);

      try {
        const response = await api.get("/api/my-orders/");
        const orders = Array.isArray(response.data)
          ? response.data
          : [];

        const selectedOrder = orders.find(
          (item) => String(item.id) === String(orderId)
        );

        if (!selectedOrder) {
          if (!cancelled) {
            setError("Order not found.");
          }
          return;
        }

        if (!cancelled) {
          setOrder(selectedOrder);
        }
      } catch (err) {
        console.error("Failed to load order:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
              "Unable to load this order. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

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

      case "FAILED":
      case "CANCELLED":
        return "bg-red-50 text-red-700 ring-1 ring-red-200";

      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    }
  }

  function getTrackingInfo(status) {
    const normalizedStatus = status?.toUpperCase();

    const steps = [
      {
        title: "Order Placed",
        description: "Your order has been created.",
      },
      {
        title: "Confirmed",
        description: "The store has confirmed your order.",
      },
      {
        title: "Shipped",
        description: "Your order has been dispatched.",
      },
      {
        title: "Delivered",
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
      isCancelled: normalizedStatus === "CANCELLED",
      isFailed: normalizedStatus === "FAILED",
    };
  }

  const tracking = getTrackingInfo(order?.status);
  const isPaymentFailed =
    order?.payment_status?.toUpperCase() === "FAILED";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto min-h-[70vh] max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/my-orders"
          className="font-semibold text-indigo-600 transition hover:text-indigo-800"
        >
          ← Back to My Orders
        </Link>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <p className="mt-4 font-medium text-slate-600">
              Loading order details...
            </p>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-red-700">{error}</p>
            <Link
              to="/my-orders"
              className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Return to My Orders
            </Link>
          </div>
        ) : order ? (
          <section className="mt-6 space-y-6">
            {/* Order summary */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-800 p-6 text-white sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-200">
                  Order details
                </p>

                <h1 className="mt-2 text-3xl font-black">
                  Order #{order.id}
                </h1>

                <p className="mt-2 text-sm text-slate-300">
                  Placed on {formatDate(order.created_at)}
                </p>
              </div>

              <div className="p-6 sm:p-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Total amount
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                      ₹{formatAmount(order.total_amount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Payment method
                    </p>
                    <p className="mt-2 font-bold text-slate-900">
                      {order.payment_method === "COD"
                        ? "Cash on Delivery"
                        : order.payment_method === "STRIPE"
                          ? "Online Payment"
                          : order.payment_method || "Unavailable"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(order.status)}`}
                  >
                    Order: {order.status || "Unavailable"}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(order.payment_status)}`}
                  >
                    Payment: {order.payment_status || "Unavailable"}
                  </span>
                </div>

                {isPaymentFailed && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="font-bold text-red-800">
                      Payment unsuccessful
                    </p>
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {order.payment_error ||
                        "Your payment could not be completed. Check your payment status before trying again."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order tracking */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">
                Order tracking
              </h2>

              {tracking.isCancelled || tracking.isFailed ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="font-bold text-red-800">
                    {tracking.isCancelled
                      ? "This order has been cancelled."
                      : "This order has failed."}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-red-700">
                    Contact the store if you need help with this order.
                  </p>
                </div>
              ) : tracking.currentStep === -1 ? (
                <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  Tracking is not available for this order status yet.
                  Please check with the store for an update.
                </p>
              ) : (
                <>
                  <div className="mt-6 space-y-0">
                    {tracking.steps.map((step, index) => {
                      const isComplete = index <= tracking.currentStep;
                      const isCurrent = index === tracking.currentStep;

                      return (
                        <div key={step.title} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                isComplete
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {isComplete ? "✓" : index + 1}
                            </div>

                            {index < tracking.steps.length - 1 && (
                              <div
                                className={`h-12 w-0.5 ${
                                  index < tracking.currentStep
                                    ? "bg-indigo-500"
                                    : "bg-slate-200"
                                }`}
                              />
                            )}
                          </div>

                          <div className="pb-8">
                            <p
                              className={`font-bold ${
                                isCurrent
                                  ? "text-indigo-700"
                                  : isComplete
                                    ? "text-slate-900"
                                    : "text-slate-400"
                              }`}
                            >
                              {step.title}
                              {isCurrent && " · Current status"}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    Tracking reflects the order status stored by the
                    store. It does not provide live courier location or
                    delivery estimates.
                  </p>
                </>
              )}
            </div>

            {/* Purchased items */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">
                Items in this order
              </h2>

              {order.items?.length ? (
                <div className="mt-5 space-y-3">
                  {order.items.map((item, index) => (
                    <div
                      key={`${order.id}-${item.product_id}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">
                          {item.product_name ||
                            `Product #${item.product_id}`}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Quantity: {item.quantity}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Unit price: ₹
                          {formatAmount(item.price_at_purchase)}
                        </p>
                      </div>

                      <p className="shrink-0 font-bold text-slate-900">
                        ₹
                        {formatAmount(
                          Number(item.price_at_purchase) *
                            Number(item.quantity)
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No item details are available.
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
                <Link
                  to="/my-orders"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  ← All orders
                </Link>

                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  Continue shopping →
                </Link>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

export default OrderDetails;