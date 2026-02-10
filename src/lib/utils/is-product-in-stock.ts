export const isProductInStock = (productVariant: {
  manage_inventory: boolean | null;
  allow_backorder: boolean | null;
  inventory_quantity?: number | null;
}) => {
  if (!productVariant.manage_inventory) {
    return true;
  }

  if (productVariant.allow_backorder) {
    return true;
  }

  if (productVariant.manage_inventory && productVariant.inventory_quantity) {
    return true;
  }

  return false;
};
