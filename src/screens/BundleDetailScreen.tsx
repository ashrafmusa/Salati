import React, { useState, useMemo, useEffect } from 'react';
// FIX: Replaced react-router-dom namespace import with named imports (useParams, Link) and removed the namespace prefix to resolve build errors.
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
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
import MetaTagManager from '../components/MetaTagManager';
import ProductImageGallery from '../components/ProductImageGallery';
import RelatedProducts from '../components/RelatedProducts';

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
            await db.collection('reviews').add({
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
  const { addToCart, areAllItemsLoaded } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [bundleItems, setBundleItems] = useState<Item[]>([]);
  const [availableExtras, setAvailableExtras] = useState<ExtraItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedExtras, setSelectedExtras] = useState<ExtraItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [allItems, setAllItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchBundleDetails = async () => {
        try {
            const bundleRef = db.collection('bundles').doc(id);
            const bundleDoc = await bundleRef.get();

            if (bundleDoc.exists) {
                const bundleData = { id: bundleDoc.id, ...bundleDoc.data() } as Bundle;
                setBundle(bundleData);

                const itemIds = bundleData.contents.map(c => c.itemId);
                if (itemIds.length > 0) {
                    const itemsQuery = db.collection('items').where(firebase.firestore.FieldPath.documentId(), 'in', itemIds);
                    const itemsSnapshot = await itemsQuery.get();
                    const itemsData = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
                    setBundleItems(itemsData);
                }

                if (bundleData.availableExtras && bundleData.availableExtras.length > 0) {
                    const extrasQuery = db.collection('extras').where(firebase.firestore.FieldPath.documentId(), 'in', bundleData.availableExtras);
                    const extrasSnapshot = await extrasQuery.get();
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

    const reviewsQuery = db.collection('reviews').where('productId', '==', id).orderBy('date', 'desc');
    const unsubscribeReviews = reviewsQuery.onSnapshot(snapshot => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    });

    const itemsQuery = db.collection('items');
    const unsubscribeItems = itemsQuery.onSnapshot(snapshot => {
        setAllItems(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Item)));
    });

    return () => {
      unsubscribeReviews();
      unsubscribeItems();
    };
  }, [id]);

  const bundleBasePrice = useMemo(() => {
    return bundle ? calculateBundlePrice(bundle, bundleItems) : 0;
  }, [bundle, bundleItems]);
  
  const total = bundleBasePrice + selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const isFavorited = bundle ? isInWishlist(bundle.id) : false;
  const isOutOfStock = bundle?.stock !== undefined && bundle.stock <= 0;
  const isLowStock = bundle?.stock !== undefined && bundle.stock > 0 && bundle.stock < 10;
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><SpinnerIcon className="w-12 h-12 text-primary animate-spin" /></div>;
  }

  if (!bundle) {
    return (
      <div>
        <MetaTagManager title="الحزمة غير موجودة - سـلـتـي" />
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
    if(isOutOfStock || !areAllItemsLoaded) return;
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

  const getButtonContent = () => {
    if (isOutOfStock) return 'نفدت الكمية';
    if (!areAllItemsLoaded) return '...جار التحميل';
    if (isAdding) return <SpinnerIcon className="w-6 h-6 animate-spin" />;
    return 'إضافة للعربة';
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <MetaTagManager 
        title={`${bundle.arabicName} - سـلـتـي`}
        description={bundle.description ? bundle.description.substring(0, 160) : `شراء حزمة ${bundle.arabicName} بأفضل سعر وجودة عبر منصة سـلـتـي.`}
      />
      <SubPageHeader title={bundle.arabicName} />
      <div className="pb-40 max-w-5xl mx-auto">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
                <ProductImageGallery 
                    mainImage={bundle.imageUrl}
                    otherImages={bundle.imageUrls}
                    altText={bundle.arabicName}
                />
              <button onClick={handleToggleWishlist} className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <HeartIcon className={`w-6 h-6 ${isFavorited ? 'text-red-500' : 'text-slate-500'}`} filled={isFavorited} />
                {isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              </button>
