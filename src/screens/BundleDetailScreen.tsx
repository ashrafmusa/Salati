import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, onSnapshot, query, where, orderBy, collection, documentId, getDocs, addDoc } from 'firebase/firestore';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import SubPageHeader from '../components/SubPageHeader';
import { calculateBundlePrice, getOptimizedImageUrl } from '../utils/helpers';
import { Bundle, ExtraItem, Review, Item } from '../types';
import { CheckCircleIcon, HeartIcon, StarIcon, SpinnerIcon, PackageIcon, PencilIcon } from '../assets/icons';
import { useAuth } from '../hooks/useAuth';
import SectionHeader from '../components/SectionHeader';
import ReviewSummary from '../components/ReviewSummary';
import ReviewCard from '../components/ReviewCard';

const StarRating: React.FC<{ rating: number; reviewCount: number }> = ({ rating, reviewCount }) => (
    <div className="flex items-center">
        <div className="flex">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} filled={i < Math.round(rating)} className={`w-5 h-5 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-slate-300'}`} />
            ))}
        </div>
        <span className="mr-2 text-sm text-slate-500 dark:text-slate-400">({reviewCount} مراجعات)</span>
    </div>
);

const WriteReviewForm: React.FC<{ productId: string }> = ({ productId }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || rating === 0 || !comment.trim()) {
            alert("Please provide a rating and a comment.");
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'reviews'), {
                productId,
                author: user.name,
                rating,
                comment,
                date: new Date().toISOString(),
            });
            setRating(0);
            setComment('');
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
                <PencilIcon className="w-5 h-5"/>
                اكتب مراجعتك
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-center gap-2" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <StarIcon
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            filled={(hoverRating || rating) >= star}
                            className={`w-8 h-8 cursor-pointer transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-slate-300'}`}
                        />
                    ))}
                </div>
                <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="شاركنا رأيك..."
                    rows={4}
                    className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary"
                    required
                />
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-secondary transition disabled:bg-slate-400">
                    {isSubmitting ? 'جارِ الإرسال...' : 'إرسال المراجعة'}
                </button>
            </form>
        </div>
    );
};

const BundleDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [bundleItems, setBundleItems] = useState<Item[]>([]);
  const [availableExtras, setAvailableExtras] = useState<ExtraItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedExtras, setSelectedExtras] = useState<ExtraItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchBundleDetails = async () => {
        try {
            const bundleRef = doc(db, 'bundles', id);
            const bundleDoc = await getDoc(bundleRef);

            if (bundleDoc.exists()) {
                const bundleData = { id: bundleDoc.id, ...bundleDoc.data() } as Bundle;
                setBundle(bundleData);

                const itemIds = bundleData.contents.map(c => c.itemId);
                if (itemIds.length > 0) {
                    const itemsQuery = query(collection(db, 'items'), where(documentId(), 'in', itemIds));
                    const itemsSnapshot = await getDocs(itemsQuery);
                    const itemsData = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
                    setBundleItems(itemsData);
                }

                if (bundleData.availableExtras && bundleData.availableExtras.length > 0) {
                    const extrasQuery = query(collection(db, 'extras'), where(documentId(), 'in', bundleData.availableExtras));
                    const extrasSnapshot = await getDocs(extrasQuery);
                    setAvailableExtras(extrasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExtraItem)));
                }
            }
        } catch (err) {
            console.error("Error fetching bundle details:", err);
        } finally {
            setLoading(false);
        }
    };
    
    fetchBundleDetails();

    const reviewsQuery = query(collection(db, 'reviews'), where('productId', '==', id), orderBy('date', 'desc'));
    const unsubscribeReviews = onSnapshot(reviewsQuery, snapshot => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    });

    return () => unsubscribeReviews();
  }, [id]);

  const bundleBasePrice = useMemo(() => {
    return bundle ? calculateBundlePrice(bundle, bundleItems) : 0;
  }, [bundle, bundleItems]);
  
  const total = bundleBasePrice + selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const isFavorited = bundle ? isInWishlist(bundle.id) : false;
  const isOutOfStock = bundle?.stock !== undefined && bundle.stock <= 0;
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><SpinnerIcon className="w-12 h-12 text-primary animate-spin" /></div>;
  }

  if (!bundle) {
    return (
      <div>
        <SubPageHeader title="خطأ" />
        <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">الحزمة غير موجودة</h2>
            <Link to="/" className="text-primary hover:underline">العودة إلى الرئيسية</Link>
        </div>
      </div>
    );
  }
  
  const handleToggleWishlist = () => {
    if (isFavorited) {
      removeFromWishlist(bundle.id);
    } else {
      addToWishlist(bundle.id);
    }
  };
  
  const handleAddToCart = () => {
    if(isOutOfStock) return;
    setIsAdding(true);
    setTimeout(() => {
        addToCart(bundle, selectedExtras);
        setIsAdded(true);
        setIsAdding(false);
        setTimeout(() => setIsAdded(false), 2000);
    }, 500);
  };
  
  const handleExtraToggle = (extra: ExtraItem) => {
    setSelectedExtras(prev => 
        prev.find(e => e.id === extra.id) 
            ? prev.filter(e => e.id !== extra.id) 
            : [...prev, extra]
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <SubPageHeader title={bundle.arabicName} />
      <div className="pb-40 max-w-5xl mx-auto">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <img src={getOptimizedImageUrl(bundle.imageUrl, 800)} alt={bundle.arabicName} className="w-full h-auto rounded-2xl shadow-lg object-cover" />
              <button onClick={handleToggleWishlist} className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <HeartIcon className={`w-6 h-6 ${isFavorited ? 'text-red-500' : 'text-slate-500'}`} filled={isFavorited} />
                {isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <PackageIcon className="w-6 h-6 text-primary" />
                <span className="font-bold text-primary text-lg">حزمة منتجات</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">{bundle.arabicName}</h1>
              {reviews.length > 0 && <StarRating rating={averageRating} reviewCount={reviews.length} />}
              <p className="text-slate-600 dark:text-slate-300 text-lg">{bundle.description}</p>
              
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <h3 className="font-bold text-xl mb-3 text-slate-800 dark:text-slate-100">مكونات الحزمة</h3>
                <ul className="space-y-2">
                  {bundleItems.map(item => {
                      const content = bundle.contents.find(c => c.itemId === item.id);
                      return (
                          <li key={item.id} className="flex items-center gap-3">
                              <img src={getOptimizedImageUrl(item.imageUrl, 100)} alt={item.arabicName} className="w-12 h-12 rounded-md object-cover"/>
                              <div>
                                  <p className="font-semibold text-slate-700 dark:text-slate-200">{item.arabicName}</p>
                                  <p className="text-sm text-slate-500">الكمية: {content?.quantity}</p>
                              </div>
                          </li>
                      )
                  })}
                </ul>
              </div>

              {availableExtras.length > 0 && (
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-xl mb-3 text-slate-800 dark:text-slate-100">إضافات اختيارية</h3>
                    <div className="space-y-3">
                      {availableExtras.map(extra => (
                        <div key={extra.id} onClick={() => handleExtraToggle(extra)} className={`flex items-center p-3 rounded-lg cursor-pointer border-2 transition ${selectedExtras.find(e => e.id === extra.id) ? 'border-primary bg-primary/10' : 'border-slate-200 dark:border-slate-700'}`}>
                           <img src={getOptimizedImageUrl(extra.imageUrl, 100)} alt={extra.name} className="w-12 h-12 rounded-md object-cover"/>
                           <div className="flex-grow mr-4">
                             <p className="font-semibold text-slate-700 dark:text-slate-200">{extra.name}</p>
                             <p className="text-sm text-primary font-bold">{extra.price} ج.س</p>
                           </div>
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedExtras.find(e => e.id === extra.id) ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                             {selectedExtras.find(e => e.id === extra.id) && <CheckCircleIcon className="w-4 h-4 text-white"/>}
                           </div>
                        </div>
                      ))}
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 mt-8">
            <SectionHeader title="المراجعات والتقييمات" />
            <div className="space-y-6">
                {reviews.length > 0 ? (
                    <>
                        <ReviewSummary reviews={reviews} />
                        <div className="space-y-4">
                           {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                        </div>
                    </>
                ) : (
                    <p className="text-center text-slate-500 py-8">لا توجد مراجعات لهذا المنتج حتى الآن.</p>
                )}
                 <WriteReviewForm productId={bundle.id} />
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
                <Link to="/cart" className="px-4 py-2.5 rounded-lg bg-primary text-white font-semibold">عرض العربة</Link>
            </div>
          ) : (
            <div className="flex justify-between items-center gap-4">
              <div>
                  <span className="text-sm text-slate-500">الإجمالي</span>
                  <span className="text-3xl font-bold text-secondary block">{total.toLocaleString()} ج.س</span>
              </div>
              <button onClick={handleAddToCart} disabled={isAdding || isOutOfStock} className="flex-grow sm:flex-grow-0 sm:w-48 px-6 py-3 rounded-lg bg-primary text-white font-bold text-lg flex items-center justify-center">
                {isOutOfStock ? 'نفدت الكمية' : (isAdding ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : 'إضافة للعربة')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// FIX: Added default export to fix lazy loading issue.
export default BundleDetailScreen;