import {
  $cartItemCount,
  $regionId,
  initCart,
  toggleCartSidebar,
} from "@lib/stores/cart";
import { useStore } from "@nanostores/react";
import { useEffect } from "react";

interface NavProps {
  countryCode: string;
  regionId: string | null;
}

export const Nav = ({ countryCode, regionId }: NavProps) => {
  const cartItemCount = useStore($cartItemCount);

  useEffect(() => {
    if (regionId) {
      $regionId.set(regionId);
      initCart();
    }
  }, [regionId]);

  const handleCartClick = () => {
    toggleCartSidebar();
  };

  return (
    <header className="flex items-center w-full p-8 h-24">
      <div className="flex items-center gap-6 flex-1">
        <a href={`/${countryCode}/store`} className="text-sm hover:underline">
          Products
        </a>
      </div>

      <a
        href={`/${countryCode}`}
        className="text-sm font-bold uppercase tracking-wide"
      >
        Astro Medusa Store
      </a>

      <div className="flex items-center gap-6 flex-1 justify-end">
        <button
          onClick={handleCartClick}
          className="text-sm hover:underline relative"
          aria-label={`Shopping cart with ${cartItemCount} item${cartItemCount !== 1 ? "s" : ""}`}
        >
          <span aria-live="polite" aria-atomic="true">
            Cart ({cartItemCount})
          </span>
        </button>
      </div>
    </header>
  );
};
