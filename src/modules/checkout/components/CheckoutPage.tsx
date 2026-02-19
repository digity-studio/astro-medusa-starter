import { $cart } from "@lib/stores/cart";
import { useStore } from "@nanostores/react";
import { type RegionCountry } from "./AddressFields";
import { OrderSummary } from "./OrderSummary";
import { ShippingAddressStep } from "./ShippingAddressStep";

interface CheckoutPageProps {
  countryCode: string;
  countries: RegionCountry[];
}

const INACTIVE_STEPS = ["Delivery", "Payment", "Review"];

export const CheckoutPage = ({ countryCode, countries }: CheckoutPageProps) => {
  const cart = useStore($cart);

  if (!cart || !cart.items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-6">Add items before checking out.</p>
        <a
          href={`/${countryCode}/store`}
          className="inline-block bg-black text-white py-3 px-8 rounded-md hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left column: checkout steps */}
        <div className="lg:col-span-2 space-y-0">
          <ShippingAddressStep cart={cart} countries={countries} />

          {INACTIVE_STEPS.map((step) => (
            <div key={step} className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-2xl font-bold text-gray-400">{step}</h2>
            </div>
          ))}
        </div>

        {/* Right column: order summary */}
        <div className="lg:col-span-1">
          <OrderSummary cart={cart} />
        </div>
      </div>
    </div>
  );
};
