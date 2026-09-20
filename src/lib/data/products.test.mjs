import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProductListQuery,
  listAllProducts,
} from "../utils/product-pagination.ts";

const productPage = (start, length) =>
  Array.from({ length }, (_, index) => ({ id: `prod_${start + index}` }));

describe("product pagination", () => {
  it("requests every field rendered by the store cards", () => {
    assert.deepEqual(buildProductListQuery("reg_test", 0), {
      region_id: "reg_test",
      fields:
        "id,title,thumbnail,*images,*variants.calculated_price,*categories,*collection",
      limit: 100,
      offset: 0,
    });
  });

  it("pages until the complete catalog has been collected", async () => {
    const pages = [
      { products: productPage(0, 100), count: 230 },
      { products: productPage(100, 100), count: 230 },
      { products: productPage(200, 30), count: 230 },
    ];
    const queries = [];

    const products = await listAllProducts("reg_test", async (query) => {
      queries.push(query);
      return pages.shift();
    });

    assert.equal(products.length, 230);
    assert.deepEqual(
      queries.map(({ offset }) => offset),
      [0, 100, 200],
    );
  });

  it("stops on a short page even when count is inconsistent", async () => {
    let requests = 0;

    await listAllProducts("reg_test", async () => {
      requests += 1;
      return { products: productPage(0, 2), count: 999 };
    });

    assert.equal(requests, 1);
  });
});
