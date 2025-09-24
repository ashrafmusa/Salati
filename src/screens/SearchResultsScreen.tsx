import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StoreProduct, Item, Bundle } from '../types';
import { db } from '../firebase/config';
import StoreProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { calculateStoreProductPrice } from '../utils/helpers';
import SubPageHeader from '../components/SubPageHeader';
import MetaTagManager from '../components/MetaTagManager';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { useSettings } from '../contexts/SettingsContext';

const SearchResultsScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { settings } = useSettings();
  
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        const itemsSnapshot = await db.collection('items').get();
        const bundlesSnapshot = await db.collection('bundles').get();
        const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'item' } as Item));
        const bundles = bundlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'bundle' } as Bundle));
        setAllItems(items);
        setAllProducts([...items, ...bundles]);
      } catch (error) {
        console.error("Error fetching all products for search:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, []);

  const searchResults = useMemo(() => {
    if (!query) return [];
    const lowercasedQuery = query.toLowerCase();
    return allProducts.filter(p => 
        p.arabicName.toLowerCase().includes(lowercasedQuery) || 
        p.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [query, allProducts]);
  
  const productPrices = useMemo(() => {
    const priceMap = new Map<string, number>();
    if (!settings) return priceMap;
    searchResults.forEach(p => {
        priceMap.set(p.id, calculateStoreProductPrice(p, allItems, settings));
    });
    return priceMap;
  }, [searchResults, allItems, settings]);

  return (
    <div>
      <MetaTagManager title={`نتائج البحث عن "${query}" - سـلـتـي`} />
      <SubPageHeader title={`نتائج البحث عن "${query}"`} backPath="/" itemCount={searchResults.length} />
      <div className="p-4 max-w-4xl mx-auto">
        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {Array.from({ length: 6 }).map((_, index) => <ProductCardSkeleton key={index} />)}
           </div>
        ) : searchResults.length === 0 ? (
          <EmptyState message="لم يتم العثور على منتجات تطابق بحثك." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map(product => (
              <StoreProductCard key={product.id} product={product} price={productPrices.get(product.id) || 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsScreen;