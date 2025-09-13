import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StoreProduct, Item, Bundle } from '../types';
import { db } from '../firebase/config';
import StoreProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { calculateBundlePrice } from '../utils/helpers';
import SubPageHeader from '../components/SubPageHeader';
import MetaTagManager from '../components/MetaTagManager';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

const SearchResultsScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
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
        console.error("Error fetching products for search:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!query) return [];
    const lowercasedQuery = query.toLowerCase();
    return allProducts.filter(p =>
      p.arabicName.toLowerCase().includes(lowercasedQuery) ||
      p.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [query, allProducts]);

  const productPrices = useMemo(() => {
    const priceMap = new Map<string, number>();
    allProducts.forEach(p => {
        if (p.type === 'item') {
            priceMap.set(p.id, p.price);
        } else {
            priceMap.set(p.id, calculateBundlePrice(p, allItems));
        }
    });
    return priceMap;
  }, [allProducts, allItems]);

  return (
    <div>
      <MetaTagManager title={`نتائج البحث عن "${query}" - سـلـتـي`} />
      <SubPageHeader title={`نتائج البحث عن: "${query}"`} backPath="/" />
      
      <div className="p-4 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState message={`لا توجد نتائج بحث تطابق "${query}"`} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, index) => (
              <div key={product.id} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                <StoreProductCard product={product} price={productPrices.get(product.id) || 0} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsScreen;