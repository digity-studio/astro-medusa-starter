import { sdk } from "@lib/sdk";
import { addShippingMethod } from "@lib/stores/cart";
import { convertToLocale } from "@lib/utils/money";
import type {
  StoreCart,
  StoreCartShippingOptionWithServiceZone,
} from "@medusajs/types";
import { useCallback, useEffect, useState } from "react";

interface InPostPoint {
  name: string;
  [key: string]: unknown;
}

interface DeliveryStepProps {
  cart: StoreCart;
  mode: "edit" | "read" | "inactive";
  onContinue: () => void;
  onEdit?: () => void;
}

const CheckCircle = () => (
  <span className="inline-flex items-center justify-center w-5 h-5 bg-black rounded-full shrink-0">
    <svg
      className="w-3 h-3 text-white"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 6l3 3 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

/**
 * Detect whether a shipping option requires an InPost locker selection.
 * Checks the provider metadata or option name for known InPost identifiers.
 */
function isInPostLockerOption(
  option: StoreCartShippingOptionWithServiceZone,
): boolean {
  const data = (option as unknown as Record<string, unknown>).data as
    | Record<string, unknown>
    | undefined;
  return data?.id === "inpost_locker_standard";
}

export const DeliveryStep = ({
  cart,
  mode,
  onContinue,
  onEdit,
}: DeliveryStepProps) => {
  const [shippingOptions, setShippingOptions] = useState<
    StoreCartShippingOptionWithServiceZone[]
  >([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [selectedLockerPoint, setSelectedLockerPoint] =
    useState<InPostPoint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "edit") return;

    const fetchOptions = async () => {
      setIsLoading(true);
      setError("");
      try {
        const { shipping_options } =
          await sdk.store.fulfillment.listCartOptions({ cart_id: cart.id });
        setShippingOptions(shipping_options);

        // Pre-select if cart already has a shipping method
        const existingMethodId = cart.shipping_methods?.[0]?.shipping_option_id;
        if (existingMethodId) {
          setSelectedOptionId(existingMethodId);
        }
      } catch (err) {
        console.error("Failed to load shipping options:", err);
        setError("Failed to load shipping options. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [mode, cart.id]);

  const selectedOption = shippingOptions.find((o) => o.id === selectedOptionId);
  const needsLocker = selectedOption
    ? isInPostLockerOption(selectedOption)
    : false;

  const handleOptionChange = async (optionId: string) => {
    if (isSaving) return;
    setSelectedOptionId(optionId);
    // Clear locker selection when switching options
    setSelectedLockerPoint(null);
    setIsSaving(true);
    setError("");

    const option = shippingOptions.find((o) => o.id === optionId);
    const isLocker = option ? isInPostLockerOption(option) : false;

    try {
      // For locker options, don't save yet — wait for point selection
      if (isLocker) {
        document.dispatchEvent(new CustomEvent("inpost:preload"));
        setIsSaving(false);
        return;
      }
      await addShippingMethod(optionId);
    } catch (err) {
      console.error("Failed to update shipping method:", err);
      setError("Failed to update shipping method. Please try again.");
      const savedMethodId = cart.shipping_methods?.[0]?.shipping_option_id;
      setSelectedOptionId(savedMethodId ?? "");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLockerPointSelected = useCallback(
    async (point: InPostPoint) => {
      setSelectedLockerPoint(point);
      setIsSaving(true);
      setError("");
      try {
        await addShippingMethod(selectedOptionId, {
          target_point: point.name,
        });
      } catch (err) {
        console.error("Failed to set locker shipping method:", err);
        setError("Failed to save locker selection. Please try again.");
        setSelectedLockerPoint(null);
      } finally {
        setIsSaving(false);
      }
    },
    [selectedOptionId],
  );

  // Listen for point selection from the Astro-rendered InPost GeoWidget
  useEffect(() => {
    const handler = (e: Event) => {
      const point = (e as CustomEvent).detail as InPostPoint;
      handleLockerPointSelected(point);
    };
    document.addEventListener("inpost:pointSelected", handler);
    return () => document.removeEventListener("inpost:pointSelected", handler);
  }, [handleLockerPointSelected]);

  if (mode === "inactive") {
    return (
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-400">Delivery</h2>
      </div>
    );
  }

  if (mode === "read") {
    const method = cart.shipping_methods?.[0];
    const currencyCode = cart.currency_code || "USD";

    return (
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Delivery
            <CheckCircle />
          </h2>
          <button
            type="button"
            onClick={onEdit}
            className="text-blue-600 hover:underline text-sm"
          >
            Edit
          </button>
        </div>

        {method && (
          <div className="text-sm">
            <p className="font-medium mb-1">Shipping method</p>
            <p className="text-gray-700">
              {method.name}
              {" — "}
              {method.amount === 0
                ? "Free"
                : convertToLocale({ amount: method.amount, currencyCode })}
            </p>
            {(() => {
              const data = method.data as Record<string, unknown> | undefined;
              const targetPoint = data?.target_point as string | undefined;
              return targetPoint ? (
                <p className="text-gray-500 mt-1">Locker: {targetPoint}</p>
              ) : null;
            })()}
          </div>
        )}
      </div>
    );
  }

  const currencyCode = cart.currency_code || "USD";

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <h2 className="text-2xl font-bold mb-6">Delivery</h2>

      <div>
        <p className="font-medium mb-1">Shipping method</p>
        <p className="text-sm text-gray-500 mb-4">
          How would you like your order delivered
        </p>

        {isLoading && (
          <p className="text-sm text-gray-500 mb-4">
            Loading shipping options...
          </p>
        )}

        {!isLoading && shippingOptions.length === 0 && !error && (
          <p className="text-sm text-gray-500 mb-4">
            No shipping options available for your address.
          </p>
        )}

        {!isLoading && shippingOptions.length > 0 && (
          <div className="space-y-3 mb-6">
            {shippingOptions.map((option) => {
              const isLocker = isInPostLockerOption(option);
              const isSelected = selectedOptionId === option.id;

              return (
                <div key={option.id}>
                  <label
                    className={`flex items-center justify-between border rounded-md px-4 py-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-black"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping_option"
                        value={option.id}
                        checked={isSelected}
                        onChange={() => handleOptionChange(option.id)}
                        className="w-4 h-4 accent-black"
                      />
                      <span className="text-sm font-medium">{option.name}</span>
                    </div>
                    <span className="text-sm text-gray-700">
                      {option.amount === 0
                        ? "Free"
                        : convertToLocale({
                            amount: option.amount,
                            currencyCode,
                          })}
                    </span>
                  </label>

                  {isLocker && isSelected && (
                    <div className="mt-3">
                      {selectedLockerPoint ? (
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <span className="font-medium">Selected locker:</span>
                          <span>{selectedLockerPoint.name}</span>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          document.dispatchEvent(new CustomEvent("inpost:open"))
                        }
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedLockerPoint
                          ? "Change locker"
                          : "Choose locker"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="button"
          disabled={
            !selectedOptionId ||
            isSaving ||
            (needsLocker && !selectedLockerPoint)
          }
          onClick={onContinue}
          className="bg-black text-white py-3 px-8 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Continue to payment"}
        </button>
      </div>
    </div>
  );
};
