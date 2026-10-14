
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/dashboard");
      setStats(response.data);
    } catch (err) {
      console.error("Admin dashboard loading error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
        fetchDashboard();
    }, 0);

    return () => clearTimeout(timerId);
  }, [fetchDashboard]);

  const cards = [
    {
      title: "Total Products",
      value: stats?.total_products ?? 0,
      description: "All products in your catalogue",
      icon: "▦",
      iconStyle: "bg-indigo-50 text-indigo-600",
      accent: "border-t-indigo-500",
    },
    {
      title: "Active Products",
      value: stats?.active_products ?? 0,
      description: "Currently available products",
      icon: "✓",
      iconStyle: "bg-emerald-50 text-emerald-600",
      accent: "border-t-emerald-500",
    },
    {
      title: "Inactive Products",
      value: stats?.inactive_products ?? 0,
      description: "Products not currently available",
      icon: "◷",
      iconStyle: "bg-amber-50 text-amber-600",
      accent: "border-t-amber-500",
    },
    {
      title: "Total Orders",
      value: stats?.total_orders ?? 0,
      description: "All customer orders",
      icon: "🛍",
      iconStyle: "bg-blue-50 text-blue-600",
      accent: "border-t-blue-500",
    },
    {
      title: "Pending Orders",
      value: stats?.pending_orders ?? 0,
      description: "Awaiting the next status update",
      icon: "◷",
      iconStyle: "bg-orange-50 text-orange-600",
      accent: "border-t-orange-500",
    },
    {
      title: "Total Customers",
      value: stats?.total_customers ?? 0,
      description: "Registered customer accounts",
      icon: "♙",
      iconStyle: "bg-purple-50 text-purple-600",
      accent: "border-t-purple-500",
    },
  ];

  const totalProducts = stats?.total_products ?? 0;
  const activeProducts = stats?.active_products ?? 0;
  const pendingOrders = stats?.pending_orders ?? 0;
  const totalCustomers = stats?.total_customers ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 p-6 text-white shadow-xl sm:p-9 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Administration overview
              </span>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Welcome to your
                <span className="block text-indigo-200">
                  StyleHub dashboard
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Monitor your store, manage products, review customer orders,
                and keep your business running smoothly.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchDashboard}
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-indigo-950 shadow-lg transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={loading ? "animate-spin" : ""}>↻</span>
              {loading ? "Refreshing..." : "Refresh statistics"}
            </button>
          </div>

          <div className="relative mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-5 text-sm text-indigo-100">
            <span className="flex items-center gap-2">
              <span className="text-lg">▦</span>
              Product overview
            </span>
            <span className="flex items-center gap-2">
              <span className="text-lg">🛍</span>
              Order monitoring
            </span>
            <span className="flex items-center gap-2">
              <span className="text-lg">♙</span>
              Customer insights
            </span>
          </div>
        </section>

        {/* Statistics */}
        <section className="mt-9">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                At a glance
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Store overview
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Key statistics retrieved from your backend.
              </p>
            </div>

            {!loading && !error && stats && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Data loaded
              </span>
            )}
          </div>

          {loading && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              <p className="mt-4 font-semibold text-slate-700">
                Loading store statistics
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while we retrieve your dashboard data.
              </p>
            </div>
          )}

          {error && !loading && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6"
            >
              <h3 className="font-bold text-red-800">
                Unable to load dashboard
              </h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={fetchDashboard}
                className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && stats && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <article
                  key={card.title}
                  className={`group rounded-2xl border border-slate-200 border-t-4 ${card.accent} bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-7`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        {card.title}
                      </p>
                      <p className="mt-4 text-4xl font-black tracking-tight text-slate-900">
                        {card.value}
                      </p>
                    </div>

                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl font-black ${card.iconStyle}`}
                    >
                      {card.icon}
                    </span>
                  </div>

                  <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section className="mt-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-600">
              Manage your store
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Quick actions
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Access the most important management tools.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <article className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-lg sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-black text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                  ▦
                </span>
                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                  Catalogue
                </span>
              </div>

              <h3 className="mt-6 text-xl font-extrabold">
                Product Management
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-7 text-slate-500">
                Add and update products, manage inventory, edit product
                information, and control product availability.
              </p>

              <Link
                to="/admin/products"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Manage Products
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
            </article>

            <article className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-pink-200 hover:shadow-lg sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-2xl font-black text-pink-600 transition group-hover:bg-pink-600 group-hover:text-white">
                  ↗
                </span>
                <span className="rounded-full bg-pink-50 px-3 py-1.5 text-xs font-bold text-pink-700">
                  Fulfilment
                </span>
              </div>

              <h3 className="mt-6 text-xl font-extrabold">
                Order Management
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-7 text-slate-500">
                Review purchases, inspect product names and payment details,
                and update order statuses throughout fulfilment.
              </p>

              <Link
                to="/admin/orders"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-pink-700"
              >
                Manage Orders
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
            </article>
          </div>
        </section>

        {/* Current store summary */}
        {!loading && !error && stats && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-lg font-extrabold">
              Current store summary
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Product availability
                </p>
                <p className="mt-2 text-xl font-extrabold text-slate-800">
                  {totalProducts > 0
                    ? `${Math.round(
                        (activeProducts / totalProducts) * 100
                      )}% active`
                    : "No products yet"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Orders awaiting action
                </p>
                <p className="mt-2 text-xl font-extrabold text-slate-800">
                  {pendingOrders}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Customer accounts
                </p>
                <p className="mt-2 text-xl font-extrabold text-slate-800">
                  {totalCustomers}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default AdminDashboard;
