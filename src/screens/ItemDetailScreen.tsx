import React, { useState, useEffect } from "react";
// FIX: Split react-router-dom imports to resolve module export errors.
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase/config";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import SubPageHeader from "../components/SubPageHeader";
import { Item, Review } from "../types";
import {
  CheckCircleIcon,
  HeartIcon,
  SpinnerIcon,
  StarIcon,
  PencilIcon,
} from "../assets/icons";
import { useAuth } from "../hooks/useAuth";
import SectionHeader from "../components/SectionHeader";
import ReviewSummary from "../components/ReviewSummary";
import ReviewCard from "../components/ReviewCard";
import MetaTagManager from "../components/MetaTagManager";
import ProductImageGallery from "../components/ProductImageGallery";
import RelatedProducts from "../components/RelatedProducts";
import { useSettings } from "../contexts/SettingsContext";
import { calculateSdgPrice } from "../utils/helpers";

const StarRating: React.FC<{ rating: number; reviewCount: number }> = ({
  rating,
  reviewCount,
}) => (
  <div className="flex items-center">
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <StarIcon
          key={i}
          filled={i < Math.round(rating)}
          className={`w-5 h-5 ${
            i < Math.round(rating) ? "text-yellow-400" : "text-slate-300"
          }`}
        />
      ))}
    </div>
    <span className="mr-2 text-sm text-slate-500 dark:text-slate-400">
      ({reviewCount} مراجعات)
    </span>
  </div>
);

const WriteReviewForm: React.FC<{ productId: string }> = ({ productId }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0 || !comment.trim()) {
      alert("Please provide a rating and a comment.");
      return;
    }
    setIsSubmitting(true);
    try {
      await db.collection("reviews").add({
        productId,
        author: user.name,
        rating,
        comment,
        date: new Date().toISOString(),
      });
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border dark:border-slate-700 mt-6">
      <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-100">
        <PencilIcon className="w-5 h-5" />
        اكتب مراجعتك
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className="flex items-center justify-center gap-2"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              filled={(hoverRating || rating) >= star}
              className={`w-8 h-8 cursor-pointer transition-colors ${
                (hoverRating || rating) >= star
                  ? "text-yellow-400"
                  : "text-slate-300"
              }`}
            />
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="شاركنا رأيك..."
          rows={4}
          className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-secondary transition disabled:bg-slate-400"
        >
          {isSubmitting ? "جارِ الإرسال..." : "إرسال المراجعة"}
        </button>
      </form>
    </div>
  );
};

const ItemDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { settings } = useSettings();

  const [item, setItem] = useState<Item | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const [allItems, setAllItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchItemDetails = async () => {
      try {
        const itemRef = db.collection("items").doc(id);
        const itemDoc = await itemRef.get();

        if (itemDoc.exists) {
          const itemData = { id: itemDoc.id, ...itemDoc.data() } as Item;
          setItem(itemData);
        }
      } catch (err) {
        console.error("Error fetching item details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();

    const reviewsQuery = db
      .collection("reviews")
      .where("productId", "==", id)
      .orderBy("date", "desc");
    const unsubscribeReviews = reviewsQuery.onSnapshot((snapshot) => {
      setReviews(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Review))
      );
    });

    // Fetch all items for related products section
    const itemsQuery = db.collection("items");
    const unsubscribeItems = itemsQuery.onSnapshot((snapshot) => {
      setAllItems(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item))
      );
    });

    return () => {
      unsubscribeReviews();
      unsubscribeItems();
    };
  }, [id]);

  const isFavorited = item ? isInWishlist(item.id) : false;
  const isOutOfStock = item?.stock !== undefined && item.stock <= 0;
  const isLowStock =
    item?.stock !== undefined && item.stock > 0 && item.stock < 10;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
  const itemPrice = item && settings ? calculateSdgPrice(item, settings) : 0;

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SpinnerIcon className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div>
        <MetaTagManager title="المنتج غير موجود - سـلـتـي" />
        <SubPageHeader title="خطأ" />
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">المنتج غير موجود</h2>
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
      addToCart(item, []);
      setIsAdded(true);
      setIsAdding(false);
      setTimeout(() => setIsAdded(false), 2000);
    }, 500);
  };

  const getButtonContent = () => {
    if (isOutOfStock) return "نفدت الكمية";
    if (isAdding) return <SpinnerIcon className="w-6 h-6 animate-spin" />;
    return "إضافة للعربة";
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <MetaTagManager
        title={`${item.arabicName} - سـلـتـي`}
        description={
          item.description
            ? item.description.substring(0, 160)
            : `شراء ${item.arabicName} بأفضل سعر وجودة عبر منصة سـلـتـي.`
        }
      />
      <SubPageHeader title={item.arabicName} />
      <div className="pb-40 max-w-5xl mx-auto">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <ProductImageGallery
                mainImage={item.imageUrl}
                otherImages={item.imageUrls}
                altText={item.arabicName}
              />
              <button
                onClick={handleToggleWishlist}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <HeartIcon
                  className={`w-6 h-6 ${
                    isFavorited ? "text-red-500" : "text-slate-500"
                  }`}
                  filled={isFavorited}
                />
                {isFavorited ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              </button>
            </div>
            <div className="space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
                {item.arabicName}
              </h1>
              {isOutOfStock ? (
                <div className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 font-bold rounded-full inline-block">
                  نفدت الكمية
                </div>
              ) : (
                isLowStock && (
                  <div className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-bold rounded-full inline-block">
                    تبقى {item.stock} فقط!
                  </div>
                )
              )}
              {reviews.length > 0 && (
                <StarRating
                  rating={averageRating}
                  reviewCount={reviews.length}
                />
              )}
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                {item.description}
              </p>
            </div>
          </div>
        </div>

        <RelatedProducts
          category={item.category}
          currentProductId={item.id}
          allItems={allItems}
        />

        <div className="p-4 mt-8">
          <SectionHeader title="المراجعات والتقييمات" />
          <div className="space-y-6">
            {reviews.length > 0 ? (
              <>
                <ReviewSummary reviews={reviews} />
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-slate-500 py-8">
                لا توجد مراجعات لهذا المنتج حتى الآن.
              </p>
            )}
            <WriteReviewForm productId={item.id} />
          </div>
        </div>
      </div>

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
            <div className="flex justify-between items-center gap-4">
              <div>
                <span className="text-sm text-slate-500">الإجمالي</span>
                <span className="text-3xl font-bold text-secondary block">
                  {itemPrice.toLocaleString()} ج.س
                </span>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={isAdding || isOutOfStock}
                className="flex-grow sm:flex-grow-0 sm:w-48 px-6 py-3 rounded-lg bg-primary text-white font-bold text-lg flex items-center justify-center transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {getButtonContent()}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailScreen;
