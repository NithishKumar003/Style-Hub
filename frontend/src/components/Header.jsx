
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition ${
      isActive
        ? "text-indigo-600"
        : "text-gray-600 hover:text-indigo-600"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-indigo-600">
          StyleHub<span className="text-gray-900">.</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-4 sm:gap-6">
          <NavLink to="/" className={linkClass}>
            Shop
          </NavLink>

          {user && (
            <>
              {user.role === "ADMIN" ? (
                <>
                  <NavLink to="/admin" className={linkClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/admin/orders" className={linkClass}>
                    Manage Orders
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/account" className={linkClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/my-orders" className={linkClass}>
                    My Orders
                  </NavLink>
                  <NavLink to="/cart" className={linkClass}>
                    Cart
                  </NavLink>
                </>
              )}

              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
              >
                Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <Link to="/login" className={linkClass({ isActive: false })}>
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;