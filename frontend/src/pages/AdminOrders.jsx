
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ALLOWED_NEXT_STATUSES = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [updateError, setUpdateError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/orders");
      const fetchedOrders = Array.isArray(response.data)
        ? response.data
        : [];

      setOrders(fetchedOrders);

      setSelectedStatuses((previous) => {
        const next = { ...previous };

        fetchedOrders.forEach((order) => {
          const currentStatus = order.status?.toUpperCase();
          const availableStatuses =
            ALLOWED_NEXT_STATUSES[currentStatus] || [];

          if (!availableStatuses.includes(next[order.id])) {
            next[order.id] = availableStatuses[0] || "";
          }
        });

        return next;
      });
    } catch (err) {
      console.error("Admin orders loading error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load customer orders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
        fetchOrders();
    }, 0);

    return () => clearTimeout(timerId);
  }, [fetchOrders]);

  const statuses = useMemo(
    () => [
      "ALL",
      ...new Set(
        orders
          .map((order) => order.status?.toUpperCase())
          .filter(Boolean)
      ),
    ],
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        order.status?.toUpperCase() === statusFilter;

      const matchesSearch =
        !searchValue ||
        String(order.id).includes(searchValue) ||
        String(order.user_id ?? "").includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  const totalOrderValue = orders.reduce(
    (total, order) =>
      total + Number(order.total_amount || 0),
    0
  );

  function formatAmount(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(date) {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "Not available"
      : parsedDate.toLocaleString("en-IN", {
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

      case "CANCELLED":
      case "FAILED":
        return "bg-red-50 text-red-700 ring-1 ring-red-200";

      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    }
  }

  function getPaymentMethodLabel(method) {
    switch (method?.toUpperCase()) {
      case "COD":
        return "Cash on Delivery";
      case "STRIPE":
        return "Online Payment";
      default:
        return method || "Not available";
    }
  }

  async function handleStatusUpdate(order) {
    const newStatus = selectedStatuses[order.id];

    if (!newStatus) {
      setUpdateError(
        "No valid next status is available for this order."
      );
      return;
    }

    if (newStatus === "CANCELLED") {
      const confirmed = window.confirm(
        `Are you sure you want to cancel order #${order.id}?`
      );

      if (!confirmed) return;
    }

    setUpdatingOrderId(order.id);
    setUpdateError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/api/admin/orders/${order.id}/status`,
        { status: newStatus }
      );

      setNotice(
        response.data?.message ||
          `Order #${order.id} status updated to ${newStatus}.`
      );

      await fetchOrders();
    } catch (err) {
      console.error("Order status update error:", err);
      setUpdateError(
        err.response?.data?.detail ||
          "Unable to update order status. Please try again."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-800 p-7 text-white shadow-lg sm:p-10">
          <Link
            to="/admin"
            className="text-sm font-medium text-indigo-200 transition hover:text-white"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                Administration
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Customer Orders
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Review customer purchases, payment details, and manage
                order status transitions.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchOrders}
              disabled={loading || updatingOrderId !== null}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-indigo-50 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "↻ Refresh orders"}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700"
          >
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={fetchOrders}
              className="mt-3 font-bold underline"
            >
              Try again
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
          >
            {notice}
            <button
              type="button"
              onClick={() => setNotice("")}
              className="ml-3 font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {updateError && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {updateError}
            <button
              type="button"
              onClick={() => setUpdateError("")}
              className="ml-3 font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {!error && (
          <>
            <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Total orders
                </p>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {loading ? "—" : orders.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  All orders returned by the API
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Pending orders
                </p>
                <p className="mt-3 text-3xl font-black text-amber-600">
                  {loading
                    ? "—"
                    : orders.filter(
                        (order) =>
                          order.status?.toUpperCase() === "PENDING"
                      ).length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Orders awaiting a status change
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                <p className="text-sm font-medium text-slate-500">
                  Total order value
                </p>
                <p className="mt-3 text-3xl font-black text-indigo-700">
                  {loading ? "—" : `₹${formatAmount(totalOrderValue)}`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Sum of order totals, not verified revenue
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Order list</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Search by order number or customer ID.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="orderSearch"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Search orders
                    </label>
                    <input
                      id="orderSearch"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Order ID or customer ID"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="statusFilter"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Filter by status
                    </label>
                    <select
                      id="statusFilter"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status === "ALL" ? "All statuses" : status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                  <p className="mt-4 text-sm text-slate-500">
                    Loading customer orders...
                  </p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-lg font-bold text-slate-800">
                    No customer orders found
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Orders will appear here when customers place them.
                  </p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  No orders match your search or status filter.
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  <p className="text-sm text-slate-500">
                    Showing {filteredOrders.length} of {orders.length} orders
                  </p>

                  {filteredOrders.map((order) => {
                    const currentStatus = order.status?.toUpperCase();
                    const nextStatuses =
                      ALLOWED_NEXT_STATUSES[currentStatus] || [];
                    const selectedStatus = selectedStatuses[order.id] || "";
                    const isUpdating = updatingOrderId === order.id;

                    return (
                      <article
                        key={order.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 transition hover:border-indigo-200 hover:shadow-md"
                      >
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:px-6">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Order number
                            </p>
                            <h3 className="mt-1 text-xl font-extrabold">
                              #{order.id}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Customer ID: {order.user_id ?? "Unavailable"}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(order.status)}`}
                            >
                              {order.status || "Unknown"}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(order.payment_status)}`}
                            >
                              Payment: {order.payment_status || "Unknown"}
                            </span>

                            <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200">
                              {getPaymentMethodLabel(order.payment_method)}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 sm:p-6">
                          <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                              <p className="text-sm text-slate-500">
                                Order date
                              </p>
                              <p className="mt-1 font-semibold">
                                {formatDate(order.created_at)}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-slate-500">
                                Total amount
                              </p>
                              <p className="mt-1 text-2xl font-black text-indigo-700">
                                ₹{formatAmount(order.total_amount)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 border-t border-slate-100 pt-5">
                            <h4 className="font-bold text-slate-800">
                              Items in this order
                            </h4>

                            {Array.isArray(order.items) &&
                            order.items.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {order.items.map((item, index) => (
                                  <div
                                    key={`${order.id}-${item.product_id}-${index}`}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"
                                  >
                                    <div>
                                      <p className="text-sm font-semibold text-slate-800">
                                        {item.product_name ||
                                          `Product #${item.product_id}`}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        Quantity: {item.quantity} × ₹
                                        {formatAmount(item.price_at_purchase)}
                                      </p>
                                    </div>

                                    <p className="font-bold text-slate-900">
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
                              <p className="mt-2 text-sm text-slate-500">
                                No item details available.
                              </p>
                            )}
                          </div>

                          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                              <div className="flex-1">
                                <label
                                  htmlFor={`next-status-${order.id}`}
                                  className="mb-1.5 block text-sm font-bold text-slate-700"
                                >
                                  Update order status
                                </label>

                                {nextStatuses.length > 0 ? (
                                  <select
                                    id={`next-status-${order.id}`}
                                    value={selectedStatus}
                                    disabled={updatingOrderId !== null}
                                    onChange={(event) =>
                                      setSelectedStatuses((previous) => ({
                                        ...previous,
                                        [order.id]: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 sm:max-w-xs"
                                  >
                                    {nextStatuses.map((status) => (
                                      <option key={status} value={status}>
                                        {status}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <p className="text-sm text-slate-500">
                                    This order is in a final status and cannot
                                    be changed.
                                  </p>
                                )}
                              </div>

                              {nextStatuses.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(order)}
                                  disabled={
                                    updatingOrderId !== null ||
                                    !selectedStatus ||
                                    selectedStatus === currentStatus
                                  }
                                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isUpdating ? "Updating..." : "Update status"}
                                </button>
                              )}
                            </div>

                            {currentStatus === "PENDING" && (
                              <p className="mt-3 text-xs leading-5 text-slate-500">
                                Verify the payment and order details before
                                confirming. COD payment should only be recorded
                                when it has actually been collected.
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default AdminOrders;