import type { LiveLoader } from "astro/loaders";
import { sdk } from "../lib/sdk";
import { regionMapCache } from "../middleware";

interface StoreProductFilter {
  id: string;
}

export const storeLoader = (): LiveLoader<
  Record<string, unknown>,
  StoreProductFilter
> => ({
  name: "store-loader",
  loadCollection: async ({ filter }) => {
    const regionId = regionMapCache.regionMap.get(
      filter as unknown as string,
    )?.id;

    try {
      const { products } = await sdk.store.product.list({
        region_id: regionId,
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
      const { product } = await sdk.store.product.retrieve(filter.id);

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
