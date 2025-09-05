import React from "react";
import { Link } from "react-router-dom";
import { StoreProduct } from "../types";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { PlusIcon, HeartIcon, StarIcon, PackageIcon } from "../assets/icons";
import { getOptimizedImageUrl } from "../utils/helpers";

interface StoreProductCardProps {
  product: StoreProduct;
  price: number;
}

const StoreProductCard: React.FC<StoreProductCardProps> = ({
  product,
  price,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const isFavorited = isInWishlist(product.id);
  const isBundle = product.type === "bundle";
  const linkPath = isBundle ? `/bundle/${product.id}` : `/item/${product.id}`;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, []);
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
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
        {product.averageRating && product.averageRating > 0 && (
          <div className="absolute top-3 left-3 bg-accent/90 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
            <StarIcon filled className="w-4 h-4" />
            <span>{product.averageRating.toFixed(1)}</span>
          </div>
        )}
        {isBundle && (
          <div className="absolute bottom-3 right-3 bg-primary/90 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
            <PackageIcon className="w-4 h-4" />
            <span>حزمة</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          {product.category}
        </p>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate mt-1 group-hover:text-primary-dark transition-colors">
          {product.arabicName}
        </h3>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xl sm:text-2xl font-bold text-primary-dark dark:text-primary font-display">
            {price.toLocaleString()} ج.س
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full p-2.5 shadow-sm transition-all duration-300 ease-in-out transform group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:rotate-90 active:scale-95"
            aria-label={`Add ${product.name} to cart`}
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default StoreProductCard;
