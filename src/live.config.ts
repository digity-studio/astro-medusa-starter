import { z } from "astro/zod";
import { defineLiveCollection } from "astro:content";
import { storeLoader } from "./loaders/store-loader";

const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  images: z
    .array(
      z.object({
        url: z.string(),
      }),
    )
    .nullable(),
  thumbnail: z.string().nullable(),
  variants: z
    .array(
      z.object({
        id: z.string(),
        sku: z.string().nullable(),
        calculated_price: z
          .object({
            calculated_amount: z.number().nullable(),
            original_amount: z.number().nullable(),
            currency_code: z.string().nullable(),
            calculated_price: z
              .object({
                price_list_type: z.string().nullable(),
              })
              .optional(),
          })
          .optional(),
      }),
    )
    .nullable(),
});

const products = defineLiveCollection({
  loader: storeLoader(),
  schema: productSchema,
});

export const collections = { products };
