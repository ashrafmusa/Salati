import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import SubPageHeader from '../components/SubPageHeader';
import StoreProductCard from '../components/ProductCard';
import { HeartIcon, SpinnerIcon, CheckCircleIcon } from '../assets/icons';
import { StoreProduct, Item, Bundle } from '../types';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import WishlistScreenSkeleton from '../components/WishlistScreenSkeleton';
import { calculateStoreProductPrice } from '../utils/helpers';
import MetaTagManager from '../components/MetaTagManager';
import { useSettings } from '../contexts/SettingsContext';

const WishlistScreen: React.FC = () => {
  const { itemIds, loading: wishlistLoading } = useWishlist();
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const [favoritedProducts, setFavoritedProducts] = useState<StoreProduct[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [addAllSuccess, setAddAllSuccess] = useState(false);

  useEffect(() => {
    const itemsQuery = db.collection('items');
    const unsub = itemsQuery.onSnapshot(snapshot => {
        setAllItems(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Item)));
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
        const allFetchedProducts: StoreProduct[] = [];
        const chunkSize = 10;
        
        for (let i = 0; i < itemIds.length; i += chunkSize) {
            const chunk = itemIds.slice(i, i + chunkSize);
            if (chunk.length === 0) continue;

            const itemsQuery = db.collection('items').where(firebase.firestore.FieldPath.documentId(), 'in', chunk);
            const bundlesQuery = db.collection('bundles').where(firebase.firestore.FieldPath.documentId(), 'in', chunk);
            
            const [itemsSnapshot, bundlesSnapshot] = await Promise.all([
                itemsQuery.get(),
                bundlesQuery.get()
            ]);
            
            const itemsList = itemsSnapshot.docs.map(doc => ({ id: doc.id, type: 'item', ...doc.data() } as Item));
            const bundlesList = bundlesSnapshot.docs.map(doc => ({ id: doc.id, type: 'bundle', ...doc.data() } as Bundle));

            allFetchedProducts.push(...itemsList, ...bundlesList);
        }
        
        setFavoritedProducts(allFetchedProducts);

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
    if (!settings) return priceMap;
    favoritedProducts.forEach(p => {
        priceMap.set(p.id, calculateStoreProductPrice(p, allItems, settings));
    });
    return priceMap;
  }, [favoritedProducts, allItems, settings]);
  
  const handleAddAllToCart = () => {
    if (isAddingAll || favoritedProducts.length === 0) return;

    setIsAddingAll(true);
    setAddAllSuccess(false);

    favoritedProducts.forEach(product => {
        if (product.stock > 0) {
            addToCart(product, 1, []);
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
      <MetaTagManager title="المفضلة - سـلـتـي" />
      <SubPageHeader title={`المفضلة (${itemIds.length})`} backPath="/" />
        {loading ? (
             <WishlistScreenSkeleton />
        ) : favoritedProducts.length === 0 ? (
          <div className="p-4 max-w-4xl mx-auto text-center py-16 flex flex-col items-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-6 sm:p-8 rounded-full mb-6">
                <HeartIcon className="w-16 h-16 sm:w-24 sm:h-24 text-red-500" />
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">قائمة المفضلة فارغة!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">أضف المنتجات التي تعجبك لتعود إليها لاحقاً.</p>
            <Link to="/" className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-secondary transition-all duration-200 transform active:scale-95 shadow-lg hover:shadow-xl">
                اكتشف المنتجات
            </Link>
          </div>
        ) : (
          <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-end mb-6">
                <button
                    onClick={handleAddAllToCart}
                    disabled={isAddingAll || addAllSuccess}
                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-secondary transition-colors disabled:bg-slate-400 flex items-center justify-center w-48"
                >
                    {isAddingAll ? (
                        <SpinnerIcon className="w-5 h-5 animate-spin" />
                    ) : addAllSuccess ? (
                        <>
                            <CheckCircleIcon className="w-5 h-5 ml-2"/>
                            <span>تمت الإضافة</span>
                        </>
                    ) : (
                        'إضافة الكل للعربة'
                    )}
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoritedProducts.map(product => (
                <StoreProductCard key={product.id} product={product} price={productPrices.get(product.id) || 0} />
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

// FIX: Added a default export to resolve the lazy loading error.
export default WishlistScreen;
