import React from "react";
// FIX: Corrected react-router-dom import to fix module resolution issue by using a namespace import and destructuring. This can resolve issues where named exports are not correctly recognized by the build tool.
import * as ReactRouterDOM from "react-router-dom";
const { Link } = ReactRouterDOM;
import { StoreProduct } from "../types";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { PlusIcon, HeartIcon, StarIcon, PackageIcon } from "../assets/icons";
import { getOptimizedImageUrl } from "../utils/helpers";
import QuantitySelector from "./QuantitySelector";

interface StoreProductCardProps {
  product: StoreProduct;
  price: number;
}

const StoreProductCard: React.FC<StoreProductCardProps> = ({
  product,
  price,
}) => {
  const { addToCart, areAllItemsLoaded, state, updateQuantity } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  // Find if this product (assuming no extras) is in the cart.
  const cartItem = state.items.find(
    (item) =>
      item.productId === product.id &&
      (product.type === "item" || item.selectedExtras.length === 0)
  );

  const isFavorited = isInWishlist(product.id);
  const isBundle = product.type === "bundle";
  const linkPath = isBundle ? `/bundle/${product.id}` : `/item/${product.id}`;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock < 10;
  const isAddToCartDisabled =
    isOutOfStock || (product.type === "bundle" && !areAllItemsLoaded);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAddToCartDisabled) return;
    addToCart(product, 1, []);
  };

  const handleToggleWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorited) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <Link
      to={linkPath}
      className="block bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden group transition-all duration-300 transform hover:-translate-y-1.5 active:translate-y-0 hover:shadow-glow-primary dark:hover:shadow-glow-primary/50 border dark:border-slate-800"
    >
      <div className="relative overflow-hidden">
        <img
          src={getOptimizedImageUrl(product.imageUrl, 400)}
          alt={product.name}
          className="w-full h-40 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold px-3 py-1 bg-red-600 rounded-full text-sm">
              نفدت الكمية
            </span>
          </div>
        )}
        {isLowStock && (
          <div className="absolute bottom-3 left-3 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
            تبقى {product.stock} فقط!
          </div>
        )}

        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 bg-white/80 dark:bg-slate-950/70 p-2 rounded-full backdrop-blur-sm transition-all duration-200 transform hover:scale-110 active:scale-95 opacity-80 group-hover:opacity-100"
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        >
          <HeartIcon
            className={`w-6 h-6 ${
              isFavorited
                ? "text-red-500"
                : "text-slate-600 dark:text-slate-300"
            }`}
            filled={isFavorited}
          />
        </button>
        {isBundle && (
          <div className="absolute bottom-3 right-3 bg-primary/90 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
            <PackageIcon className="w-4 h-4" />
            <span>حزمة</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            {product.category}
          </p>
          {product.averageRating &&
          product.reviewCount &&
          product.reviewCount > 0 ? (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <StarIcon filled className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-slate-600 dark:text-slate-300">
                {product.averageRating.toFixed(1)}
              </span>
              <span>({product.reviewCount})</span>
            </div>
          ) : null}
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate mt-2 group-hover:text-primary-dark transition-colors">
          {product.arabicName}
        </h3>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xl sm:text-2xl font-bold text-primary-dark dark:text-primary font-display">
            {price.toLocaleString()} ج.س
          </span>
          {cartItem ? (
            <QuantitySelector
              quantity={cartItem.quantity}
              onIncrease={() => {
                if (cartItem.quantity < product.stock)
                  updateQuantity(cartItem.cartId, cartItem.quantity + 1);
              }}
              onDecrease={() =>
                updateQuantity(cartItem.cartId, cartItem.quantity - 1)
              }
              isIncreaseDisabled={cartItem.quantity >= product.stock}
            />
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isAddToCartDisabled}
              className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full p-2.5 shadow-sm transition-all duration-300 ease-in-out transform group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:rotate-90 active:scale-95 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:cursor-not-allowed group-hover:disabled:transform-none group-hover:disabled:rotate-0"
              aria-label={
                isOutOfStock ? "Out of stock" : `Add ${product.name} to cart`
              }
              title={
                isAddToCartDisabled && !isOutOfStock
                  ? "Loading pricing info..."
                  : ""
              }
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default StoreProductCard;
