import type { ProductVariant } from "../../types/global";
import { getPercentageDiff } from "./get-percentage-diff";
import { convertToLocale } from "./money";

export const getPricesForVariant = (variant: ProductVariant) => {
  if (
    !variant?.calculated_price ||
    !variant.calculated_price.calculated_amount ||
    !variant.calculated_price.original_amount ||
    !variant.calculated_price.currency_code ||
    !variant.calculated_price.calculated_price
  ) {
    return null;
  }

  return {
    calculated_price_number: variant.calculated_price.calculated_amount,
    calculated_price: convertToLocale({
      amount: variant.calculated_price.calculated_amount,
      currencyCode: variant.calculated_price.currency_code,
    }),
    original_price_number: variant.calculated_price.original_amount,
    original_price: convertToLocale({
      amount: variant.calculated_price.original_amount,
      currencyCode: variant.calculated_price.currency_code,
    }),
    currency_code: variant.calculated_price.currency_code,
    price_type: variant.calculated_price.calculated_price.price_list_type,
    percentage_diff: getPercentageDiff(
      variant.calculated_price.original_amount,
      variant.calculated_price.calculated_amount,
    ),
  };
};

export const getProductPrice = ({
  productVariants,
  variantId,
}: {
  productVariants: ProductVariant[] | null;
  variantId?: string;
}) => {
  const cheapestPrice = () => {
    if (!productVariants?.length) {
      return null;
    }

    const cheapestVariant = productVariants
      .filter(
        (variant) =>
          !!variant.calculated_price &&
          !!variant.calculated_price.calculated_amount,
      )
      .sort((a, b) => {
        return (
          a.calculated_price!.calculated_amount! -
          b.calculated_price!.calculated_amount!
        );
      })[0];

    return getPricesForVariant(cheapestVariant);
  };

  const variantPrice = () => {
    if (!variantId) {
      return null;
    }

    const variant = productVariants?.find(
      (variant) => variant.id === variantId || variant.sku === variantId,
    );

    if (!variant) {
      return null;
    }

    return getPricesForVariant(variant);
  };

  return {
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  };
};
