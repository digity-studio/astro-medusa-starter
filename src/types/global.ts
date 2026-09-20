import type { HttpTypes } from "@medusajs/types";

export type ProductVariant = {
  id: HttpTypes.StoreProductVariant["id"];
  sku: HttpTypes.StoreProductVariant["sku"];
  calculated_price?: {
    calculated_amount: number | null;
    original_amount: number | null;
    currency_code: string | null;
    calculated_price?: {
      price_list_type: string | null;
    };
  };
};

export type FilterKey = "category" | "collection";

export type FilterState = Record<FilterKey, string[]>;

export type FilterOption = {
  value: string;
  label: string;
  count: number;
};

export type FilterGroup = {
  key: FilterKey;
  label: string;
  options: FilterOption[];
};

/** The minimum shape the filtering logic needs from a Medusa product. */
export type FilterableProduct = {
  categories?: { id: string; name: string }[] | null;
  collection?: { id: string; title: string } | null;
};
