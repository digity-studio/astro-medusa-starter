import type {
  FilterGroup,
  FilterKey,
  FilterState,
  FilterableProduct,
} from "../../../../types/global";
import {
  EMPTY_FILTER_STATE,
  countActiveFilters,
  filterProducts,
  parseFiltersFromSearch,
  reconcileFilters,
  serializeFiltersToSearch,
  toggleFilterValue,
} from "../../../../lib/utils/product-filters";
import { useCallback, useEffect, useMemo, useState } from "react";

type IndexedProduct = FilterableProduct & { id: string };

interface ProductFiltersProps {
  products: IndexedProduct[];
  groups: FilterGroup[];
}

/**
 * Owns the filter state for the store page. The product grid itself stays in
 * static Astro markup (so build-time image optimisation is preserved); this
 * island only toggles the visibility of the cards it does not own.
 */
export const ProductFilters = ({ products, groups }: ProductFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTER_STATE);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Restore filters from the URL so a shared or reloaded link keeps its state.
  useEffect(() => {
    setFilters(
      reconcileFilters(parseFiltersFromSearch(window.location.search), groups),
    );
  }, [groups]);

  const visibleIds = useMemo(
    () =>
      new Set(filterProducts(products, filters).map((product) => product.id)),
    [products, filters],
  );

  // The grid lives outside React, so visibility is applied to the DOM directly.
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>("[data-product-id]");

    cards.forEach((card) => {
      const productId = card.dataset.productId;
      card.hidden = !!productId && !visibleIds.has(productId);
    });
  }, [visibleIds]);

  const applyFilters = useCallback((next: FilterState) => {
    setFilters(next);

    const search = serializeFiltersToSearch(next);
    window.history.replaceState({}, "", `${window.location.pathname}${search}`);
  }, []);

  const handleToggle = (key: FilterKey, value: string) => {
    applyFilters(toggleFilterValue(filters, key, value));
  };

  const handleClearAll = () => {
    applyFilters(EMPTY_FILTER_STATE);
  };

  const activeCount = countActiveFilters(filters);
  const resultCount = visibleIds.size;

  const activePills = groups.flatMap((group) =>
    group.options
      .filter((option) => filters[group.key].includes(option.value))
      .map((option) => ({ group: group.key, ...option })),
  );

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIsDrawerOpen((open) => !open)}
          aria-expanded={isDrawerOpen}
          aria-controls="product-filter-panel"
          className="flex min-h-11 items-center gap-2 rounded-full border border-black px-5 text-sm font-medium transition-colors hover:bg-gray-100 lg:hidden"
        >
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          )}
        </button>

        <p className="text-sm text-gray-500" aria-live="polite">
          {resultCount} {resultCount === 1 ? "product" : "products"}
        </p>
      </div>

      <div
        id="product-filter-panel"
        className={`${isDrawerOpen ? "flex" : "hidden"} mt-4 flex-col gap-6 lg:mt-0 lg:flex lg:flex-row lg:flex-wrap lg:items-start lg:gap-8`}
      >
        {groups.map((group) => (
          <fieldset key={group.key} className="flex flex-col gap-3">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {group.label}
            </legend>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isActive = filters[group.key].includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(group.key, option.value)}
                    aria-pressed={isActive}
                    className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
                      isActive
                        ? "border-black bg-black text-white"
                        : "border-gray-300 text-black hover:bg-gray-100"
                    }`}
                  >
                    {option.label}
                    <span
                      className={`ml-2 text-xs ${isActive ? "text-gray-300" : "text-gray-500"}`}
                    >
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {activeCount > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {activePills.map((pill) => (
            <button
              key={`${pill.group}-${pill.value}`}
              type="button"
              onClick={() => handleToggle(pill.group, pill.value)}
              aria-label={`Remove filter ${pill.label}`}
              className="flex min-h-11 items-center gap-2 rounded-full bg-gray-100 px-4 text-sm transition-colors hover:bg-gray-200"
            >
              {pill.label}
              <span aria-hidden="true">&times;</span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleClearAll}
            className="min-h-11 px-2 text-sm underline hover:no-underline"
          >
            Clear all
          </button>
        </div>
      )}

      {resultCount === 0 && (
        <p className="mt-8 text-sm text-gray-500">
          No products match the selected filters.{" "}
          <button
            type="button"
            onClick={handleClearAll}
            className="underline hover:no-underline"
          >
            Clear all filters
          </button>{" "}
          to see the full collection.
        </p>
      )}
    </div>
  );
};
