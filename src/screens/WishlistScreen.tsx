import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../hooks/useWishlist";
import { useCart } from "../hooks/useCart";
import SubPageHeader from "../components/SubPageHeader";
import StoreProductCard from "../components/ProductCard";
import { HeartIcon, SpinnerIcon, CheckCircleIcon } from "../assets/icons";
import { StoreProduct, Item, Bundle } from "../types";
import { db } from "../firebase/config";
// FIX: The v9 modular imports are incompatible with the v8 compat `db` instance. They have been removed.
import firebase from "firebase/compat/app";
import WishlistScreenSkeleton from "../components/WishlistScreenSkeleton";
import { calculateBundlePrice } from "../utils/helpers";

export const WishlistScreen: React.FC = () => {
  const { itemIds, loading: wishlistLoading } = useWishlist();
  const { addToCart } = useCart();
  const [favoritedProducts, setFavoritedProducts] = useState<StoreProduct[]>(
    []
  );
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [addAllSuccess, setAddAllSuccess] = useState(false);

  useEffect(() => {
    // Fetch all items once for bundle price calculation
    // FIX: Converted from v9 `onSnapshot(collection(db, 'items'), ...)` to v8 syntax.
    const unsub = db.collection("items").onSnapshot((snapshot) => {
      setAllItems(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item))
      );
    });
    return unsub;
  }, []);

  useEffect(() => {
    const fetchFavoritedProducts = async () => {
      if (wishlistLoading) return;

      setLoading(true);
      if (itemIds.length === 0) {
        setFavoritedProducts([]);
        setLoading(false);
        return;
      }

      try {
        // FIX: Converted v9 `query`, `collection`, `where`, `documentId`, and `getDocs` to v8 syntax.
        const itemsQuery = db
          .collection("items")
          .where(firebase.firestore.FieldPath.documentId(), "in", itemIds);
        const bundlesQuery = db
          .collection("bundles")
          .where(firebase.firestore.FieldPath.documentId(), "in", itemIds);

        const [itemsSnapshot, bundlesSnapshot] = await Promise.all([
          itemsQuery.get(),
          bundlesQuery.get(),
        ]);

        const itemsList = itemsSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Item)
        );
        const bundlesList = bundlesSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Bundle)
        );

        setFavoritedProducts([...itemsList, ...bundlesList]);
      } catch (error) {
        console.error("Error fetching favorited products: ", error);
        setFavoritedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoritedProducts();
  }, [itemIds, wishlistLoading]);

  const productPrices = useMemo(() => {
    const priceMap = new Map<string, number>();
    favoritedProducts.forEach((p) => {
      if (p.type === "item") {
        priceMap.set(p.id, p.price);
      } else {
        priceMap.set(p.id, calculateBundlePrice(p, allItems));
      }
    });
    return priceMap;
  }, [favoritedProducts, allItems]);

  const handleAddAllToCart = () => {
    if (isAddingAll || favoritedProducts.length === 0) return;

    setIsAddingAll(true);
    setAddAllSuccess(false);

    favoritedProducts.forEach((product) => {
      if (product.stock > 0) {
        addToCart(product, []);
      }
    });

    setTimeout(() => {
      setIsAddingAll(false);
      setAddAllSuccess(true);
      setTimeout(() => setAddAllSuccess(false), 2000);
    }, 500);
  };

  return (
    <div>
      <SubPageHeader title={`المفضلة (${itemIds.length})`} backPath="/" />
      {loading ? (
        <WishlistScreenSkeleton />
      ) : favoritedProducts.length === 0 ? (
        <div className="p-4 max-w-4xl mx-auto text-center py-16 flex flex-col items-center">
          <div className="bg-red-100 dark:bg-red-900/30 p-6 sm:p-8 rounded-full mb-6">
            <HeartIcon className="w-16 h-16 sm:w-24 sm:h-24 text-red-500" />
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">
            قائمة المفضلة فارغة!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
            أضف المنتجات التي تعجبك لتعود إليها لاحقاً.
          </p>
          <Link
            to="/"
            className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-secondary transition-all duration-200 transform active:scale-95 shadow-lg hover:shadow-xl"
          >
            اكتشف المنتجات
          </Link>
        </div>
      ) : (
        <div className="p-4 max-w-4xl mx-auto">
          <div className="flex justify-end mb-6">
            <button
              onClick={handleAddAllToCart}
              disabled={isAddingAll || addAllSuccess}
              className={`px-6 py-2 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center w-48 h-12
                        ${
                          addAllSuccess
                            ? "bg-green-500"
                            : "bg-primary hover:bg-secondary"
                        }
                        ${isAddingAll ? "cursor-wait" : ""}
                    `}
            >
              {isAddingAll ? (
                <SpinnerIcon className="w-6 h-6 animate-spin" />
              ) : addAllSuccess ? (
                <span className="flex items-center gap-2">
                  <CheckCircleIcon className="w-6 h-6" /> تمت الإضافة!
                </span>
              ) : (
                "إضافة الكل للسلة"
              )}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoritedProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-stagger-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <StoreProductCard
                  product={product}
                  price={productPrices.get(product.id) || 0}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
