
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import Header from "../components/Header";
import Footer from "../components/Footer";

function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await api.get("/api/my-orders/");
        setOrders(response.data);
      } catch (err) {
        console.error("Dashboard order loading error:", err);
        setError("Unable to load your orders. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const pendingOrders = orders.filter(
    (order) => order.status?.toUpperCase() === "PENDING"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status?.toUpperCase() === "DELIVERED"
  ).length;

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount ?? 0));

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-600 p-6 text-white shadow-sm sm:p-9">
          <p className="text-sm font-semibold text-indigo-100">
            CUSTOMER DASHBOARD
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Welcome back{user?.name ? `, ${user.name}` : ""}!
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100">
            View your purchases, check order progress, and discover your next
            favourite style.
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Continue Shopping
          </Link>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Orders"
            value={loading ? "..." : orders.length}
            description="All your purchases"
          />
          <StatCard
            title="Pending Orders"
            value={loading ? "..." : pendingOrders}
            description="Orders awaiting completion"
          />
          <StatCard
            title="Delivered Orders"
            value={loading ? "..." : deliveredOrders}
            description="Successfully delivered"
          />
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <p className="mt-1 text-sm text-gray-500">
                Your five most recent purchases.
              </p>
            </div>

            <Link
              to="/my-orders"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All Orders →
            </Link>
          </div>

          {loading ? (
            <p className="py-10 text-center text-gray-500">
              Loading your orders...
            </p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-600">{error}</p>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No orders yet
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Your purchases will appear here after you place an order.
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order ID</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-4 font-semibold text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {order.items?.reduce(
                          (total, item) => total + item.quantity,
                          0
                        ) ?? 0}
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-900">
                        {formatAmount(order.total_amount)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <QuickLink
            title="Track My Orders"
            description="Review your order history and order progress."
            to="/my-orders"
          />
          <QuickLink
            title="Shopping Cart"
            description="Review your items and continue shopping."
            to="/cart"
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ title, value, description }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function QuickLink({ title, description, to }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
    >
      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600">
        {title} →
      </h3>
      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
    </Link>
  );
}

export default CustomerDashboard;