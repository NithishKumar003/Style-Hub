
import { loadStripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.error("Stripe publishable key is missing from frontend/.env");
}

const stripePromise = publishableKey
  ? loadStripe(publishableKey)
  : null;

export default stripePromise;