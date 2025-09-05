import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../hooks/useWishlist';
import SubPageHeader from '../components/SubPageHeader';
import BasketCard from '../components/BasketCard';
import { HeartIcon } from '../assets/icons';
import { Basket } from '../types';
import { db } from '../firebase/config';
// FIX: Import firebase to use firestore.FieldPath.documentId() for v8 compat.
import firebase from 'firebase/compat/app';

const WishlistScreen: React.FC = () => {
  const { itemIds, loading: wishlistLoading } = useWishlist();
  const [favoritedBaskets, setFavoritedBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoritedBaskets = async () => {
      if (wishlistLoading) return;
      
      setLoading(true);
      if (itemIds.length === 0) {
        setFavoritedBaskets([]);
        setLoading(false);
        return;
      }

      try {
        // Firestore 'in' queries are limited (currently to 30).
        // For larger wishlists, this would need batching. For now, this is fine.
        const basketsRef = db.collection('baskets');
        // FIX: Use `firebase.firestore.FieldPath.documentId()` for 'in' query with document IDs.
        const snapshot = await basketsRef.where(firebase.firestore.FieldPath.documentId(), 'in', itemIds).get();
        const basketsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Basket));
        setFavoritedBaskets(basketsList);
      } catch (error) {
          console.error("Error fetching favorited baskets: ", error);
          setFavoritedBaskets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoritedBaskets();
  }, [itemIds, wishlistLoading]);

  return (
    <div>
      <SubPageHeader title="المفضلة" backPath="/" />
      <div className="p-4 max-w-4xl mx-auto">
        {loading ? (
             <p className="text-center text-gray-500 dark:text-gray-400 mt-8">جاري تحميل المفضلة...</p>
        ) : favoritedBaskets.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full mb-6">
                <HeartIcon className="w-20 h-20 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">قائمة المفضلة فارغة!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">أضف السلات التي تعجبك لتعود إليها لاحقاً.</p>
            <Link to="/" className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-secondary transition-all duration-200 transform active:scale-95 shadow-md hover:shadow-lg">
                اكتشف السلات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoritedBaskets.map(basket => (
                <BasketCard key={basket.id} basket={basket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistScreen;