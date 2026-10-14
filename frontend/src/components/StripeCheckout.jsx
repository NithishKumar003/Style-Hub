
import { useState } from "react";
import {
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import api from "../api/axios";

function StripeCheckout({
  orderId,
  clientSecret,
  onSuccess,
  onFailure,
  onCancel,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment(event) {
    event.preventDefault();

    if (!stripe || !elements) {
      setError("Payment form is still loading. Please try again.");
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card form is unavailable. Please refresh and try again.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      // Payment failed at Stripe.
      if (result.error) {
        let failureRecorded = false;

        try {
          await api.post(`/api/payments/failure/${orderId}`);
          failureRecorded = true;
        } catch (failureError) {
          console.error(
            "Failed to record payment failure:",
            failureError
          );
        }

        if (failureRecorded) {
          onFailure?.(orderId);
          setError(
            "Payment failed. Your cart will be cleared. Please try again with a new order."
          );
        } else {
          setError(
            "Payment failed, but we could not record the failure. Please refresh and check your order before trying again."
          );
        }

        return;
      }

      // Payment did not reach the successful state.
      if (result.paymentIntent?.status !== "succeeded") {
        setError(
          "Payment has not completed. Please check its status before trying again."
        );
        return;
      }

      // Confirm the successful payment with the backend.
      await api.post(`/api/payments/confirm/${orderId}`);

      onSuccess(orderId);
    } catch (paymentError) {
      console.error("Payment confirmation error:", paymentError);

      const detail = paymentError.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Payment may have succeeded, but confirmation failed. Please check your order before trying again."
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-bold">Secure Card Payment</h3>

      <p className="mt-1 text-sm text-gray-500">
        Stripe test mode — use a test card, not your real card.
      </p>

      <form onSubmit={handlePayment}>
        <div className="mt-5 rounded-lg border border-gray-300 p-4">
          <CardElement
            options={{
              hidePostalCode: true,
              disablelink: true,
              style: {
                base: {
                  fontSize: "16px",
                  color: "#111827",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
                invalid: {
                  color: "#dc2626",
                },
              },
            }}
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!stripe || processing}
          className="mt-5 w-full rounded-lg bg-pink-600 px-4 py-3 font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? "Processing Payment..." : "Pay Securely"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default StripeCheckout;
