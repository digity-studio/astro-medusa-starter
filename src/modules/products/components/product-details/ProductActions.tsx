import { isProductInStock } from "@lib/utils/is-product-in-stock";
import clsx from "clsx";
import { useMemo, useState } from "react";

interface Props {
  options: {
    id: string;
    title: string;
    values?: {
      id: string;
      value: string;
    }[];
  }[];
  variants: {
    options:
      | {
          id: string;
          option_id?: string | null;
        }[]
      | null;
    manage_inventory: boolean | null;
    allow_backorder: boolean | null;
    inventory_quantity?: number | null;
  }[];
}

export const ProductActions = ({ options, variants }: Props) => {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

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
  }, [selectedOptions]);

  const handleOptionSelect = (optionId: string, valueId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionId]: valueId }));
  };

  const isAddToCardButtonDisabled =
    !selectedVariant || !isProductInStock(selectedVariant);

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
        onClick={() => {
          console.log("Add to Cart");
        }}
      >
        Add to Cart
      </button>
    </div>
  );
};
