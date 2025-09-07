import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Item, Bundle, StoreProduct } from '../types';
import { PaginatedSortConfig } from './usePaginatedFirestore';

export const useCombinedPaginatedFirestore = <T extends StoreProduct>(
  initialSortConfig: PaginatedSortConfig<T>,
  filters: QueryConstraint[] = [],
  pageSize = 15
) => {
  const [documents, setDocuments] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState(initialSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const itemsQuery = query(collection(db, 'items'), ...filters);
        const bundlesQuery = query(collection(db, 'bundles'), ...filters);

        const [itemsSnapshot, bundlesSnapshot] = await Promise.all([
          getDocs(itemsQuery),
          getDocs(bundlesQuery),
        ]);

        const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
        const bundles = bundlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bundle));

        const allDocs = [...items, ...bundles] as T[];

        // Apply sorting
        allDocs.sort((a, b) => {
          const key = sortConfig.key;
          if (a[key] < b[key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (a[key] > b[key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        });

        setTotalDocs(allDocs.length);

        // Apply pagination
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        setDocuments(allDocs.slice(start, end));

      } catch (e: any) {
        console.error("Firestore combined query error: ", e);
        setError(e.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sortConfig, JSON.stringify(filters), currentPage, pageSize]);

  const requestSort = (key: keyof T) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort change
  };

  const hasNextPage = useMemo(() => currentPage * pageSize < totalDocs, [currentPage, pageSize, totalDocs]);
  const hasPrevPage = useMemo(() => currentPage > 1, [currentPage]);

  const nextPage = () => {
    if (hasNextPage) setCurrentPage(p => p + 1);
  };

  const prevPage = () => {
    if (hasPrevPage) setCurrentPage(p => p - 1);
  };

  return {
    documents,
    loading,
    error,
    requestSort,
    sortConfig,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage
  };
};
