import {
  $cart,
  removeFromCart,
  updateLineItemQuantity,
} from "@lib/stores/cart";
import { convertToLocale } from "@lib/utils/money";
import { useStore } from "@nanostores/react";

interface CartPageProps {
  countryCode: string;
}

export const CartPage = ({ countryCode }: CartPageProps) => {
  const cart = useStore($cart);

  const handleRemoveItem = async (lineItemId: string) => {
    try {
      await removeFromCart(lineItemId);
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const handleQuantityChange = async (
    lineItemId: string,
    newQuantity: number,
  ) => {
    try {
      await updateLineItemQuantity(lineItemId, newQuantity);
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const itemCount = cart?.items?.length ?? 0;
  const isEmpty = itemCount === 0;
  const currencyCode = cart?.currency_code || "USD";

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      {isEmpty ? (
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Start adding items to your cart</p>
          <a
            href={`/${countryCode}/store`}
            className="inline-block bg-black text-white py-3 px-8 rounded-md hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Cart items */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-6">Cart</h1>

            {/* Cart items table */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="col-span-5">Item</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              {cart?.items?.map((item) => {
                const thumbnailUrl =
                  item.variant?.product?.thumbnail ||
                  item.variant?.product?.images?.[0]?.url;
                const productTitle = item.variant?.product?.title || "Product";
                const variantTitle = item.variant?.title || "";
                const unitPrice = item.unit_price || 0;
                const quantity = item.quantity || 1;
                const lineTotal = unitPrice * quantity;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 last:border-0 items-center"
                  >
                    {/* Item */}
                    <div className="col-span-12 md:col-span-5 flex gap-4">
                      {thumbnailUrl && (
                        <img
                          src={thumbnailUrl}
                          alt={productTitle}
                          className="w-20 h-20 object-cover rounded"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1">{productTitle}</h3>
                        {variantTitle && (
                          <p className="text-sm text-gray-500">
                            Variant: {variantTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-6 md:col-span-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, quantity - 1)
                          }
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <select
                          value={quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id,
                              parseInt(e.target.value, 10),
                            )
                          }
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          aria-label="Quantity"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(
                            (num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ),
                          )}
                        </select>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-3 md:col-span-2 text-right text-sm">
                      {convertToLocale({
                        amount: unitPrice,
                        currencyCode,
                      })}
                    </div>

                    {/* Total */}
                    <div className="col-span-3 md:col-span-2 text-right font-medium">
                      {convertToLocale({
                        amount: lineTotal,
                        currencyCode,
                      })}
                    </div>

                    {/* Remove */}
                    <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`Remove ${productTitle} from cart`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-2xl font-bold mb-6">Summary</h2>

              <div className="border border-gray-200 rounded-md p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal (excl. shipping and taxes)
                    </span>
                    <span>
                      {convertToLocale({
                        amount: cart?.item_subtotal || 0,
                        currencyCode,
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span>
                      {convertToLocale({
                        amount: cart?.shipping_total || 0,
                        currencyCode,
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes</span>
                    <span>
                      {convertToLocale({
                        amount: cart?.tax_total || 0,
                        currencyCode,
                      })}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>
                        {convertToLocale({
                          amount: cart?.total || 0,
                          currencyCode,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={`/${countryCode}/checkout`}
                  className="w-full block text-center bg-black text-white py-4 px-6 rounded-md hover:bg-gray-800 transition-colors mt-6"
                >
                  Go to checkout
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
