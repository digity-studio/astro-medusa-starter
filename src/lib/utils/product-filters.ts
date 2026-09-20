import type {
  FilterGroup,
  FilterableProduct,
  FilterState,
} from "../../types/global";

export const FILTER_PARAM_KEYS = {
  category: "category",
  collection: "collection",
} as const;

export const EMPTY_FILTER_STATE: FilterState = {
  category: [],
  collection: [],
};

/**
 * Derives the available filter options from the products actually on the page,
 * so an option is never offered when nothing would match it.
 */
export const buildFilterGroups = (
  products: FilterableProduct[],
): FilterGroup[] => {
  const categories = new Map<string, { label: string; count: number }>();
  const collections = new Map<string, { label: string; count: number }>();

  products.forEach((product) => {
    product.categories?.forEach((category) => {
      const existing = categories.get(category.id);
      categories.set(category.id, {
        label: category.name,
        count: (existing?.count ?? 0) + 1,
      });
    });

    const collection = product.collection;

    if (collection) {
      const existing = collections.get(collection.id);
      collections.set(collection.id, {
        label: collection.title,
        count: (existing?.count ?? 0) + 1,
      });
    }
  });

  const toOptions = (source: Map<string, { label: string; count: number }>) =>
    Array.from(source.entries())
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => a.label.localeCompare(b.label));

  const groups: FilterGroup[] = [
    { key: "category", label: "Category", options: toOptions(categories) },
    { key: "collection", label: "Collection", options: toOptions(collections) },
  ];

  return groups.filter((group) => group.options.length > 0);
};

const matchesGroup = (productValues: string[], selected: string[]) =>
  selected.length === 0 ||
  selected.some((value) => productValues.includes(value));

/**
 * Options within a group are OR-ed, groups are AND-ed — the behaviour shoppers
 * expect from faceted navigation.
 */
export const filterProducts = <T extends FilterableProduct>(
  products: T[],
  filters: FilterState,
): T[] =>
  products.filter((product) => {
    const categoryIds =
      product.categories?.map((category) => category.id) ?? [];
    const collectionIds = product.collection ? [product.collection.id] : [];

    return (
      matchesGroup(categoryIds, filters.category) &&
      matchesGroup(collectionIds, filters.collection)
    );
  });

export const countActiveFilters = (filters: FilterState): number =>
  filters.category.length + filters.collection.length;

export const toggleFilterValue = (
  filters: FilterState,
  key: keyof FilterState,
  value: string,
): FilterState => {
  const current = filters[key];

  return {
    ...filters,
    [key]: current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value],
  };
};

export const parseFiltersFromSearch = (search: string): FilterState => {
  const params = new URLSearchParams(search);

  const read = (key: string) =>
    params
      .getAll(key)
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean);

  return {
    category: read(FILTER_PARAM_KEYS.category),
    collection: read(FILTER_PARAM_KEYS.collection),
  };
};

export const serializeFiltersToSearch = (filters: FilterState): string => {
  const params = new URLSearchParams();

  if (filters.category.length > 0) {
    params.set(FILTER_PARAM_KEYS.category, filters.category.join(","));
  }

  if (filters.collection.length > 0) {
    params.set(FILTER_PARAM_KEYS.collection, filters.collection.join(","));
  }

  const query = params.toString();

  return query ? `?${query}` : "";
};

/**
 * Drops selections that no longer exist in the catalog so a stale bookmarked
 * URL cannot hide every product with no way to tell why.
 */
export const reconcileFilters = (
  filters: FilterState,
  groups: FilterGroup[],
): FilterState => {
  const valid = (key: keyof FilterState) =>
    new Set(
      groups
        .find((group) => group.key === key)
        ?.options.map((option) => option.value) ?? [],
    );

  const validCategories = valid("category");
  const validCollections = valid("collection");

  return {
    category: filters.category.filter((value) => validCategories.has(value)),
    collection: filters.collection.filter((value) =>
      validCollections.has(value),
    ),
  };
};
