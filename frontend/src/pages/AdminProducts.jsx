
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category: "",
  image_url: "",
  stock: "0",
};

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/products");
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Admin products loading error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load products. Please check your admin login."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
        fetchProducts();
    }, 0);

    return () => clearTimeout(timerId);
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !searchValue ||
        product.name?.toLowerCase().includes(searchValue) ||
        product.category?.toLowerCase().includes(searchValue) ||
        String(product.id).includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && product.is_active) ||
        (statusFilter === "INACTIVE" && !product.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  function formatAmount(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEditing(product) {
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      category: product.category || "",
      image_url: product.image_url || "",
      stock: String(product.stock ?? 0),
    });
    setEditingId(product.id);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      image_url: form.image_url.trim() || null,
      stock: Number(form.stock),
    };

    if (
      productData.name.length < 2 ||
      productData.description.length < 5 ||
      productData.category.length < 2 ||
      !Number.isFinite(productData.price) ||
      productData.price <= 0 ||
      !Number.isInteger(productData.stock) ||
      productData.stock < 0
    ) {
      setError(
        "Please enter a valid name, description, category, positive price, and non-negative whole-number stock."
      );
      setSaving(false);
      return;
    }

    try {
      if (editingId !== null) {
        await api.put(`/api/products/${editingId}`, productData);
        setNotice("Product updated successfully.");
      } else {
        await api.post("/api/products/", productData);
        setNotice("Product added successfully.");
      }

      resetForm();
      await fetchProducts();
    } catch (err) {
      console.error("Product save error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to save the product. Please check the entered details."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(product) {
    if (!product.is_active) {
      setError("This product is already inactive.");
      return;
    }

    const confirmed = window.confirm(
      `Deactivate "${product.name}"? It will no longer appear in the public catalogue.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/api/products/${product.id}`);
      setNotice(`"${product.name}" has been deactivated.`);
      await fetchProducts();
    } catch (err) {
      console.error("Product deactivation error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to deactivate this product."
      );
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
            &larr; Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                Administration
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Product Management
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Add products, update catalogue details, check stock, and
                deactivate products that should no longer be sold.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchProducts}
              disabled={loading || saving}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-indigo-50 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh products"}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {error}
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

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total products</p>
            <p className="mt-3 text-3xl font-black">
              {loading ? "—" : products.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Active products</p>
            <p className="mt-3 text-3xl font-black text-emerald-700">
              {loading ? "—" : products.filter((p) => p.is_active).length}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Inactive products</p>
            <p className="mt-3 text-3xl font-black text-amber-700">
              {loading ? "—" : products.filter((p) => !p.is_active).length}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">
                {editingId !== null ? `Edit Product #${editingId}` : "Add a Product"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                All prices and stock values are validated by the backend.
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-semibold text-indigo-700 hover:underline"
              >
                Cancel editing
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="productName" className="mb-1.5 block text-sm font-semibold">
                Product name *
              </label>
              <input
                id="productName"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
                minLength={2}
                maxLength={150}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="e.g. Classic Cotton T-Shirt"
              />
            </div>

            <div>
              <label htmlFor="productCategory" className="mb-1.5 block text-sm font-semibold">
                Category *
              </label>
              <input
                id="productCategory"
                name="category"
                value={form.category}
                onChange={handleFormChange}
                required
                minLength={2}
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="e.g. Men"
              />
            </div>

            <div>
              <label htmlFor="productPrice" className="mb-1.5 block text-sm font-semibold">
                Price (₹) *
              </label>
              <input
                id="productPrice"
                name="price"
                type="number"
                value={form.price}
                onChange={handleFormChange}
                required
                min="0.01"
                step="0.01"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="999.00"
              />
            </div>

            <div>
              <label htmlFor="productStock" className="mb-1.5 block text-sm font-semibold">
                Stock quantity *
              </label>
              <input
                id="productStock"
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleFormChange}
                required
                min="0"
                step="1"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="productDescription" className="mb-1.5 block text-sm font-semibold">
                Description *
              </label>
              <textarea
                id="productDescription"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                required
                minLength={5}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="Describe the product..."
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="productImage" className="mb-1.5 block text-sm font-semibold">
                Image URL (optional)
              </label>
              <input
                id="productImage"
                name="image_url"
                type="url"
                value={form.image_url}
                onChange={handleFormChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="https://example.com/product.jpg"
              />
            </div>

            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Product"}
              </button>

              {editingId === null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Clear Form
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Product Catalogue</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search products and filter by active status.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="productSearch" className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Search products
                </label>
                <input
                  id="productSearch"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, category, or ID"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label htmlFor="productStatus" className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Filter by status
                </label>
                <select
                  id="productStatus"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="ALL">All products</option>
                  <option value="ACTIVE">Active only</option>
                  <option value="INACTIVE">Inactive only</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              <p className="mt-4 text-sm text-slate-500">Loading products...</p>
            </div>
          ) : error && products.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Products could not be loaded. Resolve the error above and refresh.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No products match your search or filter.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Price</th>
                    <th className="px-3 py-3">Stock</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-lg font-bold text-indigo-600">
                              {product.name?.charAt(0)?.toUpperCase() || "P"}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{product.name}</p>
                            <p className="mt-1 text-xs text-slate-500">ID: {product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">{product.category}</td>
                      <td className="px-3 py-4 font-semibold">₹{formatAmount(product.price)}</td>
                      <td className="px-3 py-4">{product.stock}</td>
                      <td className="px-3 py-4">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          product.is_active
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                        }`}>
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startEditing(product)}
                            className="font-semibold text-indigo-700 hover:underline"
                          >
                            Edit
                          </button>
                          {product.is_active && (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(product)}
                              className="font-semibold text-red-600 hover:underline"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-4 text-xs text-slate-500">
                Showing {filteredProducts.length} of {products.length} products.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AdminProducts;