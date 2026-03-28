import { sdk } from "@lib/sdk";
import type { StoreCart } from "@medusajs/types";
import { atom, computed } from "nanostores";

const CART_FIELDS =
  "*items,*items.variant,*items.variant.product,*items.variant.product.images,*items.variant.product.thumbnail,*shipping_address,*billing_address,*shipping_methods,*payment_collection,*payment_collection.payment_sessions";

// Cart state atom
export const $cart = atom<StoreCart | null>(null);

// Sidebar visibility atom
export const $isCartSidebarOpen = atom<boolean>(false);

// Current region ID atom (set server-side, used client-side)
export const $regionId = atom<string | null>(null);

// Computed cart item count
export const $cartItemCount = computed($cart, (cart) => {
  if (!cart?.items) return 0;
  return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
});

// Cart ID storage key
const CART_ID_KEY = "cart_id";

/**
 * Get cart ID from localStorage
 */
function getCartId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CART_ID_KEY);
}

/**
 * Save cart ID to localStorage
 */
function saveCartId(cartId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_ID_KEY, cartId);
}

/**
 * Clear cart ID from localStorage
 */
function clearCartId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_ID_KEY);
}

/**
 * Initialize cart - check localStorage for existing cart or create new one
 */
export async function initCart(): Promise<void> {
  try {
    const regionId = $regionId.get();
    if (!regionId) {
      console.warn("Region ID not set, cannot initialize cart");
      return;
    }

    const baseUrl = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL;

    if (!baseUrl) {
      console.error(
        "Medusa SDK baseUrl is not configured. Please set PUBLIC_MEDUSA_BACKEND_URL environment variable.",
      );
      return;
    }

    const existingCartId = getCartId();

    if (existingCartId) {
      // Try to retrieve existing cart
      try {
        const { cart } = await sdk.store.cart.retrieve(existingCartId, {
          fields: CART_FIELDS,
        });
        $cart.set(cart);
        return;
      } catch (error) {
        // Cart doesn't exist or is invalid, create new one
        console.warn(
          "Failed to retrieve existing cart, creating new one:",
          error,
        );
        clearCartId();
      }
    }

    // Create new cart
    const { cart } = await sdk.store.cart.create(
      {
        region_id: regionId,
      },
      {
        fields: CART_FIELDS,
      },
    );

    $cart.set(cart);
    saveCartId(cart.id);
  } catch (error) {
    console.error("Failed to initialize cart:", error);
  }
}

/**
 * Add item to cart
 */
export async function addToCart(
  variantId: string,
  quantity: number,
): Promise<void> {
  try {
    // Ensure cart exists
    if (!$cart.get()) {
      await initCart();
    }

    const cart = $cart.get();
    if (!cart) {
      throw new Error("Cart not initialized");
    }

    // Add line item
    const { cart: updatedCart } = await sdk.store.cart.createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {
        fields: CART_FIELDS,
      },
    );

    $cart.set(updatedCart);
    // Open sidebar after adding item
    $isCartSidebarOpen.set(true);
  } catch (error) {
    console.error("Failed to add item to cart:", error);
    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(lineItemId: string): Promise<void> {
  try {
    const cart = $cart.get();
    if (!cart) {
      throw new Error("Cart not initialized");
    }

    await sdk.store.cart.deleteLineItem(cart.id, lineItemId, {
      fields: CART_FIELDS,
    });

    // Retrieve updated cart (deleteLineItem returns parent but it might be undefined)
    const { cart: updatedCart } = await sdk.store.cart.retrieve(cart.id, {
      fields: CART_FIELDS,
    });

    $cart.set(updatedCart);
  } catch (error) {
    console.error("Failed to remove item from cart:", error);
    throw error;
  }
}

/**
 * Update line item quantity
 */
export async function updateLineItemQuantity(
  lineItemId: string,
  quantity: number,
): Promise<void> {
  try {
    const cart = $cart.get();
    if (!cart) {
      throw new Error("Cart not initialized");
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await removeFromCart(lineItemId);
      return;
    }

    const { cart: updatedCart } = await sdk.store.cart.updateLineItem(
      cart.id,
      lineItemId,
      {
        quantity,
      },
      {
        fields: CART_FIELDS,
      },
    );

    $cart.set(updatedCart);
  } catch (error) {
    console.error("Failed to update line item quantity:", error);
    throw error;
  }
}

/**
 * Toggle cart sidebar
 */
export function toggleCartSidebar(): void {
  $isCartSidebarOpen.set(!$isCartSidebarOpen.get());
}

/**
 * Close cart sidebar
 */
export function closeCartSidebar(): void {
  $isCartSidebarOpen.set(false);
}

/**
 * Open cart sidebar
 */
export function openCartSidebar(): void {
  $isCartSidebarOpen.set(true);
}

/**
 * Add shipping method to cart
 */
export async function addShippingMethod(
  shippingOptionId: string,
): Promise<void> {
  const cart = $cart.get();
  if (!cart) {
    throw new Error("Cart not initialized");
  }

  const { cart: updatedCart } = await sdk.store.cart.addShippingMethod(
    cart.id,
    { option_id: shippingOptionId },
    {
      fields: CART_FIELDS,
    },
  );

  $cart.set(updatedCart);
}

/**
 * Initiate a payment session for the cart
 */
export async function initPaymentSession(providerId: string): Promise<void> {
  const cart = $cart.get();
  if (!cart) {
    throw new Error("Cart not initialized");
  }

  await sdk.store.payment.initiatePaymentSession(cart, {
    provider_id: providerId,
  });

  const { cart: updatedCart } = await sdk.store.cart.retrieve(cart.id, {
    fields: CART_FIELDS,
  });

  $cart.set(updatedCart);
}

/**
 * Complete cart and place the order.
 */
export async function completeCart() {
  const cart = $cart.get();
  if (!cart) {
    throw new Error("Cart not initialized");
  }

  try {
    const result = await sdk.store.cart.complete(cart.id);

    if (result.type === "order") {
      clearCartId();
      $cart.set(null);
    }

    return result;
  } catch {
    // If we get a conflict (idempotency error), the cart was likely already
    // completed by a payment provider webhook. Clear the cart and signal
    // the caller so it can show a success message.
    clearCartId();
    $cart.set(null);
    return { type: "already_completed" as const };
  }
}

/**
 * Update cart shipping address and email
 */
type CartAddress = {
  first_name: string;
  last_name: string;
  address_1: string;
  company?: string;
  postal_code: string;
  city: string;
  country_code: string;
  province?: string;
  phone?: string;
};

export async function updateCartAddress(data: {
  email: string;
  shipping_address: CartAddress;
  billing_address?: CartAddress;
}): Promise<void> {
  const cart = $cart.get();
  if (!cart) {
    throw new Error("Cart not initialized");
  }

  const { cart: updatedCart } = await sdk.store.cart.update(cart.id, data, {
    fields: CART_FIELDS,
  });

  $cart.set(updatedCart);
}
