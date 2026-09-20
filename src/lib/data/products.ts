import type { HttpTypes } from "@medusajs/types";
import { sdk } from "@lib/sdk";

const PRODUCTS_PAGE_SIZE = 100;

/**
 * Pages through the catalog rather than taking Medusa's default first page, so
 * the store grid and the filters derived from it cover every product.
 */
export const listProducts = async (regionId: string) => {
  try {
    const all: HttpTypes.StoreProduct[] = [];

    for (let offset = 0; ; offset += PRODUCTS_PAGE_SIZE) {
      const { products, count } = await sdk.store.product.list({
        region_id: regionId,
        // `*` selects rather than extends, so the relations the grid already
        // relied on must be listed alongside the ones filtering needs —
        // without `*variants.calculated_price` every card loses its price.
        fields:
          "id,title,thumbnail,*images,*variants.calculated_price,*categories,*collection",
        limit: PRODUCTS_PAGE_SIZE,
        offset,
      });

      all.push(...products);

      // Stop on a short page too, in case `count` is missing or inconsistent.
      if (products.length < PRODUCTS_PAGE_SIZE || all.length >= count) {
        break;
      }
    }

    return all;
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
