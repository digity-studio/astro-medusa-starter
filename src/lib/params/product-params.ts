import { sdk } from "../sdk";

interface ProductParams {
  params: {
    countryCode: string;
    productId: string;
  };
}

export const getProductParams = async (): Promise<ProductParams[]> => {
  try {
    const { regions } = await sdk.store.region.list();
    const { products } = await sdk.store.product.list();

    let paths: ProductParams[] = [];

    regions.forEach((region) => {
      region.countries?.forEach((country) => {
        products.forEach((product) => {
          if (!country.iso_2) {
            return;
          }

          paths.push({
            params: {
              countryCode: country.iso_2.toLowerCase(),
              productId: product.id,
            },
          });
        });
      });
    });

    return paths;
  } catch (error) {
    console.error(error);
    return [];
  }
};
