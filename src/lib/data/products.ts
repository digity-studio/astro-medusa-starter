import type { HttpTypes } from "@medusajs/types";
import { sdk } from "@lib/sdk";
import { listAllProducts } from "@lib/utils/product-pagination";

/**
 * Pages through the catalog rather than taking Medusa's default first page, so
 * the store grid and the filters derived from it cover every product.
 */
export const listProducts = async (regionId: string) => {
  try {
    return await listAllProducts<HttpTypes.StoreProduct>(regionId, (query) =>
      sdk.store.product.list(query),
    );
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch products");
  }
};

export const retrieveProduct = async (
  productId: string,
  regionId: string,
) => {
  try {
    const { product } = await sdk.store.product.retrieve(productId, {
      region_id: regionId,
      fields:
        "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,",
    });
    return product;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch product");
  }
};
