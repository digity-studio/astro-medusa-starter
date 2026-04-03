import { sdk } from "@lib/sdk";
import { completeCart, initPaymentSession } from "@lib/stores/cart";
import type { StoreCart, StorePaymentProvider } from "@medusajs/types";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";

interface PaymentStepProps {
  cart: StoreCart;
  countryCode: string;
  mode: "edit" | "inactive";
  onEdit?: () => void;
}

const CardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 text-gray-400"
    aria-hidden="true"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

function isStripeProvider(providerId: string): boolean {
  return providerId.startsWith("pp_stripe_");
}

function formatProviderName(providerId: string): string {
  if (providerId === "pp_system_default") return "Manual Payment";
  if (isStripeProvider(providerId)) return "Credit Card (Stripe)";
  return providerId
    .replace(/^pp_/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isTestProvider(providerId: string): boolean {
  return providerId === "pp_system_default";
}

export const PaymentStep = ({
  cart,
  countryCode,
  mode,
}: PaymentStepProps) => {
  const [paymentProviders, setPaymentProviders] = useState<StorePaymentProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState("");
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (mode !== "edit") return;

    const fetchProviders = async () => {
      setIsLoading(true);
      setError("");
      try {
        const { payment_providers } = await sdk.store.payment.listPaymentProviders({
          region_id: cart.region_id!,
        });
        setPaymentProviders(payment_providers);

        const existingProviderId =
          cart.payment_collection?.payment_sessions?.[0]?.provider_id;
        if (existingProviderId) {
          setSelectedProviderId(existingProviderId);
        }
      } catch (err) {
        console.error("Failed to load payment providers:", err);
        setError("Failed to load payment options. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, [mode, cart.region_id]);

  const handleProviderChange = async (providerId: string) => {
    if (isSaving) return;
    setSelectedProviderId(providerId);
    setIsSaving(true);
    setError("");
    try {
      await initPaymentSession(providerId);
    } catch (err) {
      console.error("Failed to initialize payment session:", err);
      setError("Failed to set payment method. Please try again.");
      const savedProviderId =
        cart.payment_collection?.payment_sessions?.[0]?.provider_id ?? "";
      setSelectedProviderId(savedProviderId);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    setError("");
    try {
      if (isStripeProvider(selectedProviderId) && stripe && elements) {
        const { error: stripeError } = await stripe.confirmPayment({
          elements,
          redirect: "if_required",
        });
        if (stripeError) {
          setError(stripeError.message ?? "Payment failed. Please try again.");
          return;
        }
      }

      // Save cart snapshot before completion so the fallback confirmation
      // page can still display items, addresses, and totals on a 409.
      try {
        sessionStorage.setItem("medusa_cart_snapshot", JSON.stringify(cart));
      } catch {}

      const result = await completeCart();
      if (result.type === "order" || result.type === "already_completed") {
        window.location.href = `/${countryCode}/order/confirmed`;
      } else {
        setError(result.error.message || "Failed to place order. Please try again.");
      }
    } catch (err) {
      console.error("Failed to place order:", err);
      setError("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  if (mode === "inactive") {
    return (
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-400">Payment</h2>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <h2 className="text-2xl font-bold mb-6">Payment</h2>

      <div>
        {isLoading && (
          <p className="text-sm text-gray-500 mb-4">Loading payment options...</p>
        )}

        {!isLoading && paymentProviders.length === 0 && !error && (
          <p className="text-sm text-gray-500 mb-4">
            No payment options available.
          </p>
        )}

        {!isLoading && paymentProviders.length > 0 && (
          <div className="space-y-3 mb-6">
            {paymentProviders.map((provider) => (
              <label
                key={provider.id}
                className={`flex items-center justify-between border rounded-md px-4 py-3 cursor-pointer transition-colors ${
                  selectedProviderId === provider.id
                    ? "border-black"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment_provider"
                    value={provider.id}
                    checked={selectedProviderId === provider.id}
                    onChange={() => handleProviderChange(provider.id)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-sm font-medium">
                    {formatProviderName(provider.id)}
                  </span>
                  {isTestProvider(provider.id) && (
                    <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-0.5">
                      Attention: For testing purposes only.
                    </span>
                  )}
                </div>
                <CardIcon />
              </label>
            ))}
          </div>
        )}

        {isStripeProvider(selectedProviderId) &&
          cart.payment_collection?.payment_sessions?.some(
            (s) => s.provider_id === selectedProviderId,
          ) && (
            <div className="mb-6 p-4 border border-gray-200 rounded-md">
              <PaymentElement />
            </div>
          )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="button"
          disabled={!selectedProviderId || isSaving || isPlacing}
          onClick={handlePlaceOrder}
          className="bg-black text-white py-3 px-8 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlacing ? "Placing order..." : "Place order"}
        </button>
      </div>
    </div>
  );
};
