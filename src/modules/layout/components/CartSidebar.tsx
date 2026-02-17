import {
  $cart,
  $isCartSidebarOpen,
  closeCartSidebar,
  removeFromCart,
} from "@lib/stores/cart";
import { convertToLocale } from "@lib/utils/money";
import { useStore } from "@nanostores/react";
import { useEffect, useRef } from "react";

interface CartSidebarProps {
  countryCode: string;
}

export const CartSidebar = ({ countryCode }: CartSidebarProps) => {
  const cart = useStore($cart);
  const isOpen = useStore($isCartSidebarOpen);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeCartSidebar();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      const firstFocusable = sidebarRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      closeCartSidebar();
    }
  };

  const handleRemoveItem = async (lineItemId: string) => {
    try {
      await removeFromCart(lineItemId);
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const itemCount = cart?.items?.length ?? 0;
  const isEmpty = itemCount === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold">Cart</h2>
            <button
              onClick={closeCartSidebar}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close cart"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <a
                  href={`/${countryCode}/store`}
                  onClick={closeCartSidebar}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Continue Shopping
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {cart?.items?.map((item) => {
                  const thumbnailUrl =
                    item.variant?.product?.thumbnail ||
                    item.variant?.product?.images?.[0]?.url;
                  const productTitle =
                    item.variant?.product?.title || "Product";
                  const variantTitle = item.variant?.title || "";
                  const unitPrice = item.unit_price || 0;
                  const currencyCode = cart.currency_code || "USD";

                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-6 border-b border-gray-100 last:border-0"
                    >
                      {/* Thumbnail - matches ImageCarousel thumb pattern (144x144) */}
                      {thumbnailUrl && (
                        <img
                          src={thumbnailUrl}
                          alt={productTitle}
                          width={144}
                          height={144}
                          className="w-16 h-16 aspect-square object-cover rounded"
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                      )}

                      {/* Item details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-1 truncate">
                          {productTitle}
                        </h3>
                        {variantTitle && (
                          <p className="text-xs text-gray-500 mb-1">
                            Variant: {variantTitle}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mb-2">
                          Quantity: {item.quantity}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {convertToLocale({
                              amount: unitPrice,
                              currencyCode,
                            })}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                            aria-label={`Remove ${productTitle} from cart`}
                          >
                            <svg
                              className="w-4 h-4"
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
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isEmpty && (
            <div className="border-t border-gray-200 p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal (excl. taxes)</span>
                <span className="font-medium">
                  {convertToLocale({
                    amount: cart?.item_subtotal || 0,
                    currencyCode: cart?.currency_code || "USD",
                  })}
                </span>
              </div>
              <a
                href={`/${countryCode}/cart`}
                onClick={closeCartSidebar}
                className="block w-full bg-black text-white py-3 px-6 rounded-md text-center hover:bg-gray-800 transition-colors"
              >
                Go to cart
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
