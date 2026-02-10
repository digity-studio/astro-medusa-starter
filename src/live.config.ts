import { z } from "astro/zod";
import { defineLiveCollection } from "astro:content";
import { storeLoader } from "./loaders/store-loader";

const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
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
        options: z
          .array(
            z.object({
              id: z.string(),
              option_id: z.string().nullable().optional(),
            }),
          )
          .nullable(),
        manage_inventory: z.boolean().nullable(),
        allow_backorder: z.boolean().nullable(),
        inventory_quantity: z.number().nullable().optional(),
      }),
    )
    .nullable(),
  options: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        values: z
          .array(
            z.object({
              id: z.string(),
              value: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .nullable(),
  width: z.string().nullable(),
  height: z.string().nullable(),
  length: z.string().nullable(),
  weight: z.string().nullable(),
  material: z.string().nullable(),
  origin_country: z.string().nullable(),
  type: z
    .object({
      value: z.string(),
    })
    .nullable()
    .optional(),
});

const products = defineLiveCollection({
  loader: storeLoader(),
  schema: productSchema,
});

export const collections = { products };
