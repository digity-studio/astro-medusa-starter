export const PRODUCTS_PAGE_SIZE = 100;

export const PRODUCT_CARD_FIELDS =
  "id,title,thumbnail,*images,*variants.calculated_price,*categories,*collection";

export type ProductListQuery = {
  region_id: string;
  fields: string;
  limit: number;
  offset: number;
};

type ProductPage<T> = {
  products: T[];
  count: number;
};

export const buildProductListQuery = (
  regionId: string,
  offset: number,
): ProductListQuery => ({
  region_id: regionId,
  // `*` selects rather than extends, so list every field rendered by a card.
  fields: PRODUCT_CARD_FIELDS,
  limit: PRODUCTS_PAGE_SIZE,
  offset,
});

export const listAllProducts = async <T>(
  regionId: string,
  loadPage: (query: ProductListQuery) => Promise<ProductPage<T>>,
): Promise<T[]> => {
  const all: T[] = [];

  for (let offset = 0; ; offset += PRODUCTS_PAGE_SIZE) {
    const { products, count } = await loadPage(
      buildProductListQuery(regionId, offset),
    );

    all.push(...products);

    // Stop on a short page too, in case `count` is missing or inconsistent.
    if (products.length < PRODUCTS_PAGE_SIZE || all.length >= count) {
      break;
    }
  }

  return all;
};
