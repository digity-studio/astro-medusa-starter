import { convertToLocale } from "@lib/utils/money";
import type { StoreCart } from "@medusajs/types";
import { useEffect, useState } from "react";

interface ConfirmedFallbackPageProps {
  countryCode: string;
}

function formatProviderName(providerId: string): string {
  if (providerId === "pp_system_default") return "Manual Payment";
  return providerId
    .replace(/^pp_/, "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const ConfirmedFallbackPage = ({
  countryCode,
}: ConfirmedFallbackPageProps) => {
  const [cart, setCart] = useState<StoreCart | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("medusa_cart_snapshot");
      if (raw) {
        setCart(JSON.parse(raw));
        sessionStorage.removeItem("medusa_cart_snapshot");
      }
    } catch {}
  }, []);

  const currency = cart?.currency_code ?? "usd";
  const paymentProviderId =
    cart?.payment_collection?.payment_sessions?.[0]?.provider_id;
  const shippingMethod = cart?.shipping_methods?.[0];
  const sameAddress =
    cart?.shipping_address &&
    cart?.billing_address &&
    cart.shipping_address.address_1 === cart.billing_address.address_1 &&
    cart.shipping_address.postal_code === cart.billing_address.postal_code;

  return (
    <main
      className="max-w-2xl mx-auto px-8 py-16"
      aria-label="Order confirmation"
    >
      {/* Success header */}
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-6"
          aria-hidden="true"
        >
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold mb-3">Thank you for your order!</h1>

        <p className="text-sm text-gray-500">
          Your order has been placed successfully.
          {cart?.email && (
            <>
              {" "}
              A confirmation email has been sent to{" "}
              <span className="font-medium text-gray-700">{cart.email}</span>
            </>
          )}
        </p>
      </div>

      {cart && (
        <>
          {/* Order items */}
          <section aria-labelledby="items-heading" className="mb-8">
            <h2 id="items-heading" className="text-lg font-semibold mb-4">
              Order Items
            </h2>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
              {cart.items?.map((item) => {
                const thumbnailUrl =
                  item.variant?.product?.thumbnail ||
                  item.variant?.product?.images?.[0]?.url;

                const lineTotal = (item.unit_price ?? 0) * (item.quantity ?? 1);
                return (
                  <div key={item.id} className="flex gap-4 p-4">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded border border-gray-200 shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.title}
                      </p>
                      {item.variant_title && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.variant_title}
                        </p>
                      )}
                      <div className="flex justify-between mt-2 text-sm">
                        <span className="text-gray-500">
                          {item.quantity} ×{" "}
                          {convertToLocale({
                            amount: item.unit_price ?? 0,
                            currencyCode: currency,
                          })}
                        </span>
                        <span className="font-medium">
                          {convertToLocale({
                            amount: lineTotal,
                            currencyCode: currency,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Order summary */}
          <section aria-labelledby="summary-heading" className="mb-8">
            <h2 id="summary-heading" className="text-lg font-semibold mb-4">
              Order Summary
            </h2>
            <div className="border border-gray-200 rounded-md p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>
                  {convertToLocale({
                    amount: cart.subtotal ?? 0,
                    currencyCode: currency,
                  })}
                </span>
              </div>

              {shippingMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Shipping ({shippingMethod.name})
                  </span>
                  <span>
                    {convertToLocale({
                      amount: cart.shipping_total ?? 0,
                      currencyCode: currency,
                    })}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Taxes</span>
                <span>
                  {convertToLocale({
                    amount: cart.tax_total ?? 0,
                    currencyCode: currency,
                  })}
                </span>
              </div>

              {(cart.discount_total ?? 0) > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>
                    −
                    {convertToLocale({
                      amount: cart.discount_total ?? 0,
                      currencyCode: currency,
                    })}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>
                  {convertToLocale({
                    amount: cart.total ?? 0,
                    currencyCode: currency,
                  })}
                </span>
              </div>
            </div>
          </section>

          {/* Delivery & payment */}
          <section aria-labelledby="delivery-heading" className="mb-8">
            <h2 id="delivery-heading" className="text-lg font-semibold mb-4">
              Delivery &amp; Payment
            </h2>
            <div className="border border-gray-200 rounded-md divide-y divide-gray-100 text-sm">
              {cart.shipping_address && (
                <div className="p-4">
                  <p className="font-medium mb-1">Shipping Address</p>
                  <address className="text-gray-600 not-italic leading-relaxed">
                    {cart.shipping_address.first_name}{" "}
                    {cart.shipping_address.last_name}
                    <br />
                    {cart.shipping_address.address_1}
                    {cart.shipping_address.address_2 && (
                      <>
                        <br />
                        {cart.shipping_address.address_2}
                      </>
                    )}
                    <br />
                    {cart.shipping_address.postal_code},{" "}
                    {cart.shipping_address.city}
                    <br />
                    {(
                      cart.shipping_address as {
                        country?: { display_name?: string };
                      }
                    ).country?.display_name ??
                      cart.shipping_address.country_code?.toUpperCase()}
                  </address>
                </div>
              )}

              {cart.billing_address && (
                <div className="p-4">
                  <p className="font-medium mb-1">Billing Address</p>
                  {sameAddress ? (
                    <p className="text-gray-600">Same as shipping address</p>
                  ) : (
                    <address className="text-gray-600 not-italic leading-relaxed">
                      {cart.billing_address.first_name}{" "}
                      {cart.billing_address.last_name}
                      <br />
                      {cart.billing_address.address_1}
                      <br />
                      {cart.billing_address.postal_code},{" "}
                      {cart.billing_address.city}
                    </address>
                  )}
                </div>
              )}

              {paymentProviderId && (
                <div className="p-4">
                  <p className="font-medium mb-1">Payment</p>
                  <p className="text-gray-600">
                    {formatProviderName(paymentProviderId)}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* What's next */}
          <section aria-labelledby="next-heading" className="mb-10">
            <h2 id="next-heading" className="text-lg font-semibold mb-4">
              What happens next?
            </h2>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-semibold flex items-center justify-center text-xs">
                  1
                </span>
                <span>
                  <strong className="text-gray-900">Order Processing</strong> —
                  We&apos;re preparing your items for shipment.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-semibold flex items-center justify-center text-xs">
                  2
                </span>
                <span>
                  <strong className="text-gray-900">
                    Shipment Notification
                  </strong>{" "}
                  — You&apos;ll receive an email with tracking information when
                  your order ships.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-semibold flex items-center justify-center text-xs">
                  3
                </span>
                <span>
                  <strong className="text-gray-900">Delivery</strong> — Your
                  package will arrive at your shipping address.
                </span>
              </li>
            </ol>
          </section>
        </>
      )}

      {/* CTA */}
      <div className="text-center">
        <a
          href={`/${countryCode}/store`}
          className="inline-block bg-black text-white py-3 px-10 rounded-md hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </a>
      </div>
    </main>
  );
};
