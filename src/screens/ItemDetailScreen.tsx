import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import SubPageHeader from "../components/SubPageHeader";
import { getOptimizedImageUrl } from "../utils/helpers";
import { Item, Review } from "../types";
import { CheckCircleIcon, HeartIcon, SpinnerIcon } from "../assets/icons";

const ItemDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        const itemRef = doc(db, "items", id);
        const docSnap = await getDoc(itemRef);
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() } as Item);
        }
      } catch (err) {
        console.error("Error fetching item details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const isFavorited = item ? isInWishlist(item.id) : false;
  const isOutOfStock = item?.stock !== undefined && item.stock <= 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SpinnerIcon className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div>
        <SubPageHeader title="خطأ" />
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">الصنف غير موجود</h2>
          <Link to="/" className="text-primary hover:underline">
            العودة إلى الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const handleToggleWishlist = () => {
    if (isFavorited) {
      removeFromWishlist(item.id);
    } else {
      addToWishlist(item.id);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    setTimeout(() => {
      addToCart(item);
      setIsAdded(true);
      setIsAdding(false);
    }, 500);
  };

  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        <SubPageHeader title={item.arabicName} />
        <div className="pb-40 max-w-5xl mx-auto">
          {/* Main content here, similar to BundleDetailScreen but simplified */}
          <p className="p-8 text-center">
            Details for item "{item.arabicName}"
          </p>
        </div>

        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 p-4 border-t dark:border-slate-700 shadow-inner backdrop-blur-sm z-20">
          <div className="max-w-5xl mx-auto">
            {isAdded ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="w-8 h-8 ml-3" />
                  <span className="font-bold text-lg">تمت الإضافة بنجاح!</span>
                </div>
                <Link
                  to="/cart"
                  className="px-4 py-2.5 rounded-lg bg-primary text-white font-semibold"
                >
                  عرض العربة
                </Link>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-slate-500">الإجمالي</span>
                  <span className="text-3xl font-bold text-secondary block">
                    {item.price.toLocaleString()} ج.س
                  </span>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isOutOfStock}
                  className="w-48 px-6 py-3 rounded-lg bg-primary text-white font-bold text-lg"
                >
                  {isOutOfStock ? (
                    "نفدت الكمية"
                  ) : isAdding ? (
                    <SpinnerIcon className="w-6 h-6 animate-spin" />
                  ) : (
                    "إضافة للعربة"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemDetailScreen;
