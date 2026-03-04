import { completeCart } from "@lib/stores/cart";
import { useState } from "react";

interface ReviewStepProps {
  mode: "edit" | "inactive";
  countryCode: string;
}

export const ReviewStep = ({ mode, countryCode }: ReviewStepProps) => {
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState("");

  if (mode === "inactive") {
    return (
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-400">Review</h2>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    setError("");
    try {
      const result = await completeCart();
      if (result.type === "order") {
        try {
          sessionStorage.setItem("medusa_order", JSON.stringify(result.order));
        } catch {}
        window.location.href = `/${countryCode}/order/${result.order.id}`;
      } else {
        setError(
          result.error.message || "Failed to place order. Please try again.",
        );
      }
    } catch (err) {
      console.error("Failed to place order:", err);
      setError("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">Review</h2>

      <p className="text-sm text-gray-700 mb-6">
        By clicking the Place Order button, you confirm that you have read,
        understand and accept our Terms of Use, Terms of Sale and Returns Policy
        and acknowledge that you have read Medusa Store&apos;s Privacy Policy.
      </p>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        type="button"
        disabled={isPlacing}
        onClick={handlePlaceOrder}
        className="bg-black text-white py-3 px-8 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPlacing ? "Placing order..." : "Place order"}
      </button>
    </div>
  );
};
