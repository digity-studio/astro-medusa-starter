import type { LiveLoader } from "astro/loaders";
import { sdk } from "../lib/sdk";

interface StoreProductFilter {
  id: string;
  regionId: string;
}

interface StoreCollectionFilter {
  regionId: string;
}

export const storeLoader = (): LiveLoader<
  Record<string, unknown>,
  StoreProductFilter,
  StoreCollectionFilter
> => ({
  name: "store-loader",
  loadCollection: async ({ filter }) => {
    if (!filter?.regionId) {
      return {
        error: new Error("Region ID is required"),
      };
    }

    try {
      const { products } = await sdk.store.product.list({
        region_id: filter.regionId,
      });

      return {
        entries: products.map((product) => ({
          id: product.id,
          data: product as unknown as Record<string, unknown>,
        })),
        cacheHint: {
          tags: ["products"],
          lastModified: new Date(
            products
              .map((product) => product.updated_at)
              .filter(Boolean)
              .sort(
                (a, b) => new Date(b!).getTime() - new Date(a!).getTime(),
              )[0]!,
          ),
        },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
  loadEntry: async ({ filter }) => {
    try {
      const { product } = await sdk.store.product.retrieve(filter.id, {
        region_id: filter.regionId,
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,",
      });

      return {
        id: product.id,
        data: product as unknown as Record<string, unknown>,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
