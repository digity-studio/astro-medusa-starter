import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTER_STATE,
  buildFilterGroups,
  countActiveFilters,
  filterProducts,
  parseFiltersFromSearch,
  reconcileFilters,
  serializeFiltersToSearch,
  toggleFilterValue,
} from "./product-filters";

const products = [
  {
    id: "prod_1",
    categories: [{ id: "cat_a", name: "Alpha" }],
    collection: { id: "col_winter", title: "Winter" },
  },
  {
    id: "prod_2",
    categories: [
      { id: "cat_a", name: "Alpha" },
      { id: "cat_b", name: "Beta" },
    ],
    collection: { id: "col_summer", title: "Summer" },
  },
  {
    id: "prod_3",
    categories: [{ id: "cat_c", name: "Gamma" }],
    collection: { id: "col_winter", title: "Winter" },
  },
];

describe("product filters", () => {
  it("builds sorted facet groups with product counts", () => {
    expect(buildFilterGroups(products)).toEqual([
      {
        key: "category",
        label: "Category",
        options: [
          { value: "cat_a", label: "Alpha", count: 2 },
          { value: "cat_b", label: "Beta", count: 1 },
          { value: "cat_c", label: "Gamma", count: 1 },
        ],
      },
      {
        key: "collection",
        label: "Collection",
        options: [
          { value: "col_summer", label: "Summer", count: 1 },
          { value: "col_winter", label: "Winter", count: 2 },
        ],
      },
    ]);
  });

  it("ORs values within a group and ANDs values across groups", () => {
    const filtered = filterProducts(products, {
      category: ["cat_b", "cat_c"],
      collection: ["col_winter"],
    });

    expect(filtered.map((product) => product.id)).toEqual(["prod_3"]);
  });

  it("round-trips repeated URL parameters without corrupting commas", () => {
    const filters = {
      category: ["cat_a", "cat,with,commas"],
      collection: ["col_winter"],
    };

    expect(parseFiltersFromSearch(serializeFiltersToSearch(filters))).toEqual(
      filters,
    );
  });

  it("drops stale URL values while preserving valid selections", () => {
    expect(
      reconcileFilters(
        { category: ["cat_a", "cat_stale"], collection: ["col_stale"] },
        buildFilterGroups(products),
      ),
    ).toEqual({ category: ["cat_a"], collection: [] });
  });

  it("toggles values immutably and counts active filters", () => {
    const selected = toggleFilterValue(EMPTY_FILTER_STATE, "category", "cat_a");
    const cleared = toggleFilterValue(selected, "category", "cat_a");

    expect(selected).toEqual({ category: ["cat_a"], collection: [] });
    expect(cleared).toEqual(EMPTY_FILTER_STATE);
    expect(countActiveFilters(selected)).toBe(1);
    expect(EMPTY_FILTER_STATE).toEqual({ category: [], collection: [] });
  });
});
