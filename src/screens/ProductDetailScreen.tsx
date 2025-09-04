
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import SubPageHeader from '../components/SubPageHeader';
import { calculateProductTotal, calculateItemAndExtrasTotal, getOptimizedImageUrl } from '../utils/helpers';
import { Product, ExtraItem, Review } from '../types';
import { CheckCircleIcon, HeartIcon, StarIcon, SpinnerIcon, PackageIcon } from '../assets/icons';
import { useAuth } from '../hooks/useAuth';

const StarRating: React.FC<{ rating: number, setRating?: (rating: number) => void }> = ({ rating, setRating }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const isInteractive = !!setRating;

    return (
        <div className="flex" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                    key={star}
                    className={`w-7 h-7 cursor-pointer ${isInteractive ? 'text-slate-300 dark:text-slate-600' : 'text-yellow-400'}`}
                    filled={(hoverRating || rating) >= star}
                    onClick={() => isInteractive && setRating(star)}
                    onMouseEnter={() => isInteractive && setHoverRating(star)}
                    onMouseLeave={() => isInteractive && setHoverRating(0)}
                />
            ))}
        </div>
    );
};


const ProductDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [availableExtras, setAvailableExtras] = useState<ExtraItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<ExtraItem[]>([]);
  const [pricePulse, setPricePulse] = useState(false);

  const isFavorited = product ? isInWishlist(product.id) : false;
  
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsubscribers: (() => void)[] = [];

    const fetchProduct = async () => {
        try {
            const productRef = db.collection('products').doc(id);
            const doc = await productRef.get();
            if (doc.exists) {
                const productData = { id: doc.id, ...doc.data() } as Product;
                setProduct(productData);
                
                if (productData.availableExtras && productData.availableExtras.length > 0) {
                    const extrasRef = db.collection('extras');
                    const extrasSnapshot = await extrasRef.where(firebase.firestore.FieldPath.documentId(), 'in', productData.availableExtras).get();
                    const extrasData = extrasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExtraItem));
                    setAvailableExtras(extrasData);
                }
            }
        } catch (err) {
            console.error("Error fetching product details:", err);
        } finally {
            setLoading(false);
        }
    };
    
    const subscribeToReviews = () => {
        const reviewsQuery = db.collection('reviews').where('productId', '==', id).orderBy('date', 'desc');
        const unsubscribe = reviewsQuery.onSnapshot(snapshot => {
            const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
            setReviews(reviewsData);
        });
        unsubscribers.push(unsubscribe);
    };

    fetchProduct();
    subscribeToReviews();

    return () => unsubscribers.forEach(unsub => unsub());

  }, [id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const total = product ? calculateItemAndExtrasTotal(product, selectedExtras) : 0;
  const productBaseTotal = useMemo(() => calculateProductTotal(product), [product]);
  const isOutOfStock = product?.stock !== undefined && product.stock <= 0;

  useEffect(() => {
    if (total !== productBaseTotal) {
        setPricePulse(true);
        const timer = setTimeout(() => setPricePulse(false), 300);
        return () => clearTimeout(timer);
    }
  }, [total, productBaseTotal]);

  if (loading) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
            <SpinnerIcon className="w-12 h-12 text-primary animate-spin" />
        </div>
      );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <SubPageHeader title="خطأ" />
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">المنتج غير موجود</h2>
            <Link to="/" className="text-primary hover:underline">العودة إلى الرئيسية</Link>
        </div>
      </div>
    );
  }

  const handleToggleExtra = (extra: ExtraItem) => {
    setSelectedExtras(prev => {
        const isSelected = prev.some(e => e.id === extra.id);
        if (isSelected) {
            return prev.filter(e => e.id !== extra.id);
        } else {
            return [...prev, extra];
        }
    });
  };
  
  const handleToggleWishlist = () => {
    if (product) {
      if (isFavorited) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product.id);
      }
    }
  };

  const handleAddToCart = () => {
    if(!product || isOutOfStock) return;
    setIsAdding(true);
    setTimeout(() => {
        addToCart(product, selectedExtras);
        setIsAdded(true);
        setIsAdding(false);
    }, 500);
  };
  
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setReviewError('Please log in to submit a review.');
        return;
    }
    if (userRating === 0) {
        setReviewError('يرجى تحديد تقييم (عدد النجوم).');
        return;
    }
    if (userComment.trim() === '') {
        setReviewError('يرجى كتابة تعليق.');
        return;
    }
    setReviewLoading(true);

    const newReview = {
        productId: product.id,
        author: user.name,
        rating: userRating,
        comment: userComment,
        date: new Date().toISOString(),
    };

    try {
        await db.collection('reviews').add(newReview);
        setUserRating(0);
        setUserComment('');
        setReviewError('');
        setReviewSubmitted(true);
    } catch (err) {
        console.error("Error submitting review:", err);
        setReviewError("Failed to submit review. Please try again.");
    } finally {
        setReviewLoading(false);
    }
  };

  const totalItems = product.contents.length + selectedExtras.length;

  return (
    <>
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        <SubPageHeader title={product.arabicName} />

        <div className="pb-40 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 lg:gap-12">
                <div className="md:p-4">
                  <div className="relative">
                    <img src={getOptimizedImageUrl(product.imageUrl, 800)} alt={product.name} className="w-full h-64 md:h-auto md:aspect-square object-cover rounded-b-lg md:rounded-lg shadow-lg" />
                    {isOutOfStock && (
                      <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                          نفدت الكمية
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 sm:p-6 space-y-6">
                    <div>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <p className="text-primary dark:text-green-400 text-sm font-semibold">{product.category}</p>
                                <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{product.arabicName}</h2>
                            </div>
                            <button 
                              onClick={handleToggleWishlist}
                              className="bg-white/70 dark:bg-slate-800/70 p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all duration-200 transform hover:scale-110 active:scale-95 ml-3 flex-shrink-0 shadow-sm hover:shadow-md"
                              aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                            >
                              <HeartIcon className={`w-5 h-5 sm:w-7 sm:h-7 ${isFavorited ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} filled={isFavorited} />
                            </button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mt-3 text-base">{product.description}</p>
                    </div>

                    <hr className="border-slate-200 dark:border-slate-700 !my-8" />
                    
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <PackageIcon className="w-6 h-6 text-primary"/>
                            مكونات المنتج
                        </h3>
                        <ul className="space-y-3">
                            {product.contents.map((item, index) => (
                                <li key={index} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <img 
                                        src={getOptimizedImageUrl((item as any).imageUrl || 'https://storage.googleapis.com/aistudio-hosting/salati/images/placeholder.png', 200)}
                                        onError={(e) => { e.currentTarget.src = 'https://storage.googleapis.com/aistudio-hosting/salati/images/placeholder.png'; }}
                                        alt={item.name} 
                                        className="w-16 h-16 rounded-md object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-700"
                                        loading="lazy"
                                    />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.quantity}</p>
                                    </div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-lg flex-shrink-0">{item.price} ج.س</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6 mt-6">
                {availableExtras.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">أضف لمستك الخاصة <span className="text-slate-400 font-normal text-lg">(إضافات اختيارية)</span></h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {availableExtras.map(extra => {
                                const isSelected = selectedExtras.some(e => e.id === extra.id);
                                return (
                                    <div 
                                        key={extra.id} 
                                        onClick={() => handleToggleExtra(extra)}
                                        className={`relative p-3 text-center cursor-pointer transition-all duration-200 rounded-xl border-2 ${isSelected ? 'border-primary bg-green-50 dark:bg-green-900/30 shadow-lg' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                        role="checkbox"
                                        aria-checked={isSelected}
                                    >
                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 text-primary transition-opacity duration-200">
                                                <CheckCircleIcon className="w-7 h-7 bg-white dark:bg-slate-800 rounded-full" />
                                            </div>
                                        )}
                                        <img 
                                            src={getOptimizedImageUrl(extra.imageUrl, 200)} 
                                            alt={extra.name} 
                                            className="w-24 h-24 object-cover rounded-lg mx-auto mb-3"
                                            loading="lazy"
                                        />
                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 h-10 flex items-center justify-center">{extra.name}</p>
                                        <p className="text-primary font-bold text-sm mt-1">{extra.price} ج.س</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                <hr className="border-slate-200 dark:border-slate-700 !my-8" />

                {/* Reviews Section */}
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">آراء العملاء</h3>
                    {reviews.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex items-center bg-white dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700">
                                <span className="text-4xl font-bold text-secondary">{averageRating.toFixed(1)}</span>
                                <div className="mr-4">
                                    <StarRating rating={averageRating} />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">بناءً على {reviews.length} تقييمات</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {reviews.map(review => (
                                    <div key={review.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{review.author}</p>
                                            <StarRating rating={review.rating} />
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 mt-2">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400">لا توجد تقييمات لهذا المنتج حتى الآن.</p>
                    )}
                </div>
                
                {/* Add Review Form */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border dark:border-slate-700 mt-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">أضف تقييمك</h3>
                    {reviewSubmitted ? (
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/50 rounded-lg">
                           <p className="font-semibold text-green-700 dark:text-green-300">شكراً لك! تم إرسال تقييمك بنجاح.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">تقييمك:</label>
                                <StarRating rating={userRating} setRating={setUserRating} />
                            </div>
                            <div>
                                <label htmlFor="comment" className="block text-sm font-medium text-slate-700 dark:text-slate-300">تعليقك:</label>
                                <textarea
                                    id="comment"
                                    rows={4}
                                    value={userComment}
                                    onChange={(e) => setUserComment(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                    placeholder="ما رأيك في هذا المنتج؟"
                                ></textarea>
                            </div>
                            {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}
                            <div className="text-right">
                                <button type="submit" disabled={reviewLoading} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-secondary transition-colors disabled:bg-slate-400">
                                    {reviewLoading ? 'جارِ الإرسال...' : 'إرسال التقييم'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

            </div>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 p-4 border-t dark:border-slate-700 shadow-inner backdrop-blur-sm z-20">
            <div className="max-w-5xl mx-auto">
                {isAdded ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="w-8 h-8 ml-3" />
                            <span className="font-bold text-lg">تمت الإضافة بنجاح!</span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setIsAdded(false)}
                                className="flex-1 sm:w-auto px-4 py-2.5 sm:py-3 rounded-lg bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100 font-semibold transition-colors hover:bg-slate-300 dark:hover:bg-slate-500 text-sm"
                            >
                                متابعة التسوق
                            </button>
                            <Link
                                to="/cart"
                                className="flex-1 sm:w-auto text-center px-4 py-2.5 sm:py-3 rounded-lg bg-accent text-white font-semibold transition-colors hover:bg-amber-500 shadow text-sm"
                            >
                                عرض العربة
                            </Link>
                            <Link
                                to="/checkout"
                                className="flex-1 sm:w-auto text-center px-4 py-2.5 sm:py-3 rounded-lg bg-primary text-white font-bold transition-colors hover:bg-secondary shadow-lg text-sm"
                            >
                                الدفع الآن
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                         <div>
                            <span className="text-sm text-slate-500 dark:text-slate-400 block">الإجمالي</span>
                            <span className={`text-2xl sm:text-3xl font-bold text-secondary transition-all duration-200 ${pricePulse ? 'scale-110 text-primary' : ''}`}>{total.toLocaleString()} ج.س</span>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdding || isOutOfStock}
                            className="w-full sm:w-48 px-6 py-2.5 rounded-lg text-white font-bold text-base sm:text-lg transition-all duration-300 transform active:scale-95 flex justify-center items-center shadow-lg hover:shadow-xl bg-primary hover:bg-secondary disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                           {isOutOfStock ? 'نفدت الكمية' : (isAdding ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : `إضافة (${totalItems}) للعربة`)}
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
    </>
  );
};

export default ProductDetailScreen;