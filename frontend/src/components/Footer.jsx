
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-950 text-gray-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <Link to="/" className="text-2xl font-extrabold text-white">
            StyleHub<span className="text-indigo-400">.</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-gray-400">
            Discover your style with a simple, secure and enjoyable shopping
            experience.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-white">Quick Links</h2>
          <div className="mt-3 flex flex-col items-start gap-2 text-sm">
            <Link to="/" className="hover:text-white">Shop Products</Link>
            <Link to="/cart" className="hover:text-white">Shopping Cart</Link>
            <Link to="/my-orders" className="hover:text-white">My Orders</Link>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-white">Customer Support</h2>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Need help with an order? Contact the store administrator for
            assistance.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-800 px-4 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} StyleHub. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;