import { zodResolver } from "@hookform/resolvers/zod";
import { updateCartAddress } from "@lib/stores/cart";
import type { StoreCart } from "@medusajs/types";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AddressFields,
  type AddressValues,
  type CheckoutFormValues,
  type RegionCountry,
} from "./AddressFields";

const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  company: z.string(),
  postalCode: z.string().min(1, "Postal code is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  province: z.string(),
});

// Billing fields are bare strings — validated conditionally via superRefine
const billingSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  address: z.string(),
  company: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
  province: z.string(),
});

const formSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .refine(
        (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        "Enter a valid email address",
      ),
    phone: z.string(),
    billingSameAsShipping: z.boolean(),
    shipping: addressSchema,
    billing: billingSchema,
  })
  .superRefine(({ billingSameAsShipping, billing }, ctx) => {
    if (billingSameAsShipping) return;

    const required: [keyof typeof billing, string][] = [
      ["firstName", "First name is required"],
      ["lastName", "Last name is required"],
      ["address", "Address is required"],
      ["postalCode", "Postal code is required"],
      ["city", "City is required"],
      ["country", "Country is required"],
    ];

    for (const [field, message] of required) {
      if (!billing[field].trim()) {
        ctx.addIssue({ code: "custom", path: ["billing", field], message });
      }
    }
  });

const EMPTY_ADDRESS: AddressValues = {
  firstName: "",
  lastName: "",
  address: "",
  company: "",
  postalCode: "",
  city: "",
  country: "",
  province: "",
};

function mapAddress(
  addr?: StoreCart["shipping_address"] | null,
): AddressValues {
  return {
    firstName: addr?.first_name ?? "",
    lastName: addr?.last_name ?? "",
    address: addr?.address_1 ?? "",
    company: addr?.company ?? "",
    postalCode: addr?.postal_code ?? "",
    city: addr?.city ?? "",
    country: addr?.country_code ?? "",
    province: addr?.province ?? "",
  };
}

function areSameAddress(
  a?: StoreCart["shipping_address"] | null,
  b?: StoreCart["billing_address"] | null,
): boolean {
  if (!a || !b) return false;
  return (
    a.first_name === b.first_name &&
    a.last_name === b.last_name &&
    a.address_1 === b.address_1 &&
    a.postal_code === b.postal_code &&
    a.city === b.city
  );
}

interface ShippingAddressStepProps {
  cart: StoreCart | null;
  countries: RegionCountry[];
  countryCode: string;
  mode: "edit" | "read";
  onContinue?: () => void;
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

const ReadOnlyView = ({
  cart,
  onEdit,
}: {
  cart: StoreCart;
  onEdit?: () => void;
}) => {
  const shipping = cart.shipping_address;
  const billing = cart.billing_address;
  const isBillingSame = areSameAddress(shipping, billing);

  const shippingLines = [
    shipping?.first_name && shipping?.last_name
      ? `${shipping.first_name} ${shipping.last_name}`
      : null,
    shipping?.address_1 ?? null,
    shipping?.postal_code && shipping?.city
      ? `${shipping.postal_code}, ${shipping.city}`
      : null,
    shipping?.country_code?.toUpperCase() ?? null,
  ].filter(Boolean) as string[];

  const billingLines = isBillingSame
    ? null
    : [
        billing?.first_name && billing?.last_name
          ? `${billing.first_name} ${billing.last_name}`
          : null,
        billing?.address_1 ?? null,
        billing?.postal_code && billing?.city
          ? `${billing.postal_code}, ${billing.city}`
          : null,
        billing?.country_code?.toUpperCase() ?? null,
      ].filter(Boolean) as string[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          Shipping Address
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

      <div className="grid grid-cols-3 gap-8 text-sm">
        <div>
          <p className="font-medium mb-2">Shipping Address</p>
          {shippingLines.map((line, i) => (
            <p key={i} className="text-gray-700">
              {line}
            </p>
          ))}
        </div>

        <div>
          <p className="font-medium mb-2">Contact</p>
          {cart.email && <p className="text-gray-700">{cart.email}</p>}
        </div>

        <div>
          <p className="font-medium mb-2">Billing Address</p>
          {isBillingSame ? (
            <p className="text-gray-700">
              Billing and delivery address are the same.
            </p>
          ) : (
            billingLines?.map((line, i) => (
              <p key={i} className="text-gray-700">
                {line}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const ShippingAddressStep = ({
  cart,
  countries,
  countryCode,
  mode,
  onContinue,
  onEdit,
}: ShippingAddressStepProps) => {
  const [submitError, setSubmitError] = useState("");
  const cartInitialized = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      phone: "",
      billingSameAsShipping: true,
      shipping: { ...EMPTY_ADDRESS, country: countryCode },
      billing: { ...EMPTY_ADDRESS },
    },
  });

  // Populate form from saved cart address on first load / after refresh
  useEffect(() => {
    if (!cart || cartInitialized.current) return;
    cartInitialized.current = true;

    const shipping = cart.shipping_address;
    if (!shipping?.first_name) return; // No saved address yet, keep empty defaults

    const billing = cart.billing_address;
    const billingSame =
      !billing?.first_name || areSameAddress(shipping, billing);

    reset({
      email: cart.email ?? "",
      phone: shipping.phone ?? "",
      billingSameAsShipping: billingSame,
      shipping: mapAddress(shipping),
      billing: billingSame ? mapAddress(shipping) : mapAddress(billing),
    });
  }, [cart, reset]);

  const billingSameAsShipping = watch("billingSameAsShipping");

  const onSubmit = async (data: CheckoutFormValues) => {
    setSubmitError("");
    try {
      const shippingAddress = {
        first_name: data.shipping.firstName,
        last_name: data.shipping.lastName,
        address_1: data.shipping.address,
        company: data.shipping.company || undefined,
        postal_code: data.shipping.postalCode,
        city: data.shipping.city,
        country_code: data.shipping.country,
        province: data.shipping.province || undefined,
        phone: data.phone || undefined,
      };

      await updateCartAddress({
        email: data.email,
        shipping_address: shippingAddress,
        billing_address: data.billingSameAsShipping
          ? shippingAddress
          : {
              first_name: data.billing.firstName,
              last_name: data.billing.lastName,
              address_1: data.billing.address,
              company: data.billing.company || undefined,
              postal_code: data.billing.postalCode,
              city: data.billing.city,
              country_code: data.billing.country,
              province: data.billing.province || undefined,
            },
      });

      onContinue?.();
    } catch (error) {
      console.error("Failed to update shipping address:", error);
      setSubmitError("Failed to save address. Please try again.");
    }
  };

  if (mode === "read" && cart) {
    return <ReadOnlyView cart={cart} onEdit={onEdit} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>

      <div className="space-y-4">
        <AddressFields
          prefix="shipping"
          register={register}
          errors={errors.shipping ?? {}}
          countries={countries}
        />

        {/* Billing same as shipping */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register("billingSameAsShipping")}
            className="w-4 h-4 accent-black"
          />
          <span className="text-sm">Billing address same as shipping address</span>
        </label>

        {/* Email / Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <input
              type="email"
              placeholder="Email*"
              {...register("email")}
              className={`w-full border rounded px-4 py-3 text-sm outline-none focus:border-gray-500 transition-colors ${
                errors.email ? "border-red-400" : "border-gray-300"
              }`}
            />
            <p className="text-red-500 text-xs mt-1 min-h-4">
              {errors.email?.message ?? ""}
            </p>
          </div>
          <div>
            <input
              type="tel"
              placeholder="Phone"
              {...register("phone")}
              className="w-full border border-gray-300 rounded px-4 py-3 text-sm outline-none focus:border-gray-500 transition-colors"
            />
            <p className="min-h-4 mt-1" />
          </div>
        </div>

        {/* Billing address section */}
        {!billingSameAsShipping && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
            <AddressFields
              prefix="billing"
              register={register}
              errors={errors.billing ?? {}}
              countries={countries}
            />
          </div>
        )}

        {submitError && (
          <p className="text-red-500 text-sm">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white py-3 px-8 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Continue to delivery"}
        </button>
      </div>
    </form>
  );
};
