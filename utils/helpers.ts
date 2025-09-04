import { Product, ExtraItem } from '../types';

export const calculateProductTotal = (product: Partial<Product>): number => {
  if (!product || !product.contents) {
    return 0;
  }
  return product.contents.reduce((total, item) => total + (item.price || 0), 0);
};

export const calculateItemAndExtrasTotal = (product: Product, extras: ExtraItem[]): number => {
    const productTotal = calculateProductTotal(product);
    const extrasTotal = extras.reduce((total, extra) => total + extra.price, 0);
    return productTotal + extrasTotal;
}