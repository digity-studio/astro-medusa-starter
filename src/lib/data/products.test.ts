import { beforeEach, describe, expect, it, vi } from "vitest";

const listProductsRequest = vi.hoisted(() => vi.fn());

vi.mock("@lib/sdk", () => ({
  sdk: {
    store: {
      product: {
        list: listProductsRequest,
      },
    },
  },
}));

import { listProducts } from "./products";

const productPage = (start: number, length: number) =>
  Array.from({ length }, (_, index) => ({ id: `prod_${start + index}` }));

describe("listProducts", () => {
  beforeEach(() => {
    listProductsRequest.mockReset();
  });

  it("requests every field rendered by the store cards", async () => {
    listProductsRequest.mockResolvedValue({ products: [], count: 0 });

    await listProducts("reg_test");

    expect(listProductsRequest).toHaveBeenCalledWith({
      region_id: "reg_test",
      fields:
        "id,title,thumbnail,*images,*variants.calculated_price,*categories,*collection",
      limit: 100,
      offset: 0,
    });
  });

  it("pages until the complete catalog has been collected", async () => {
    listProductsRequest
      .mockResolvedValueOnce({ products: productPage(0, 100), count: 230 })
      .mockResolvedValueOnce({ products: productPage(100, 100), count: 230 })
      .mockResolvedValueOnce({ products: productPage(200, 30), count: 230 });

    const products = await listProducts("reg_test");

    expect(products).toHaveLength(230);
    expect(listProductsRequest).toHaveBeenCalledTimes(3);
    expect(
      listProductsRequest.mock.calls.map(([query]) => query.offset),
    ).toEqual([0, 100, 200]);
  });

  it("stops on a short page even when count is inconsistent", async () => {
    listProductsRequest.mockResolvedValue({
      products: productPage(0, 2),
      count: 999,
    });

    await listProducts("reg_test");

    expect(listProductsRequest).toHaveBeenCalledTimes(1);
  });
});
