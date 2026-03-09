import { sdk } from "@lib/sdk";
import { addToCart } from "@lib/stores/cart";
import { isProductInStock } from "@lib/utils/is-product-in-stock";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

type Variant = {
  id: string;
  options:
    | {
        id: string;
        option_id?: string | null;
      }[]
    | null;
  manage_inventory: boolean | null;
  allow_backorder: boolean | null;
  inventory_quantity?: number | null;
};

interface Props {
  options: {
    id: string;
    title: string;
    values?: {
      id: string;
      value: string;
    }[];
  }[];
  variants: Variant[];
  productId: string;
  regionId: string;
}

export const ProductActions = ({
  options,
  variants: initialVariants,
  productId,
  regionId,
}: Props) => {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [isAdding, setIsAdding] = useState(false);
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [isLoadingVariants, setIsLoadingVariants] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchFreshVariants() {
      try {
        const { product } = await sdk.store.product.retrieve(productId, {
          region_id: regionId,
          fields:
            "+variants.inventory_quantity,*variants.options",
        });

        if (!cancelled && product?.variants) {
          setVariants(product.variants as Variant[]);
        }
      } catch (error) {
        console.error("Failed to fetch fresh variant data:", error);
      } finally {
        if (!cancelled) {
          setIsLoadingVariants(false);
        }
      }
    }

    fetchFreshVariants();

    return () => {
      cancelled = true;
    };
  }, [productId, regionId]);

  const selectedVariant = useMemo(() => {
    if (
      !variants.length ||
      !options.length ||
      Object.keys(selectedOptions).length !== options.length
    ) {
      return;
    }

    return variants.find((variant) =>
      variant.options?.every(
        (optionValue) =>
          optionValue.id === selectedOptions[optionValue.option_id!],
      ),
    );
  }, [selectedOptions, variants, options]);

  const handleOptionSelect = (optionId: string, valueId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionId]: valueId }));
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || isAdding) return;

    setIsAdding(true);
    try {
      await addToCart(selectedVariant.id, 1);
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const isAddToCardButtonDisabled =
    !selectedVariant ||
    isLoadingVariants ||
    !isProductInStock(selectedVariant) ||
    isAdding;

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      {options.map((option) => (
        <div key={option.id} className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{option.title}</h2>
          <div className="flex flex-wrap gap-2">
            {option.values?.map((value) => (
              <button
                key={value.id}
                className={clsx(
                  "bg-gray-100 py-2 px-4 rounded-md cursor-pointer hover:shadow-md ease-in-out duration-200 w-20 h-10 box-border",
                  {
                    border: selectedOptions[option.id] === value.id,
                  },
                )}
                onClick={() => handleOptionSelect(option.id, value.id)}
              >
                {value.value}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        className={clsx(
          "bg-black text-white py-4 px-8 rounded-md cursor-pointer hover:shadow-md ease-in-out duration-200",
          {
            "opacity-50 cursor-not-allowed": isAddToCardButtonDisabled,
          },
        )}
        disabled={isAddToCardButtonDisabled}
        onClick={handleAddToCart}
      >
        {isAdding ? "Adding..." : "Add to Cart"}
      </button>
    </div>
  );
};
