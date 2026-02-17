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
    <header className="flex items-center justify-between w-full pb-8 mb-8 border-b border-gray-200">
      <div className="flex items-center">
        <a
          href={`/${countryCode}`}
          className="text-xl font-bold uppercase tracking-wide"
        >
          Astro Medusa Store
        </a>
      </div>

      <div className="flex items-center gap-6">
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
