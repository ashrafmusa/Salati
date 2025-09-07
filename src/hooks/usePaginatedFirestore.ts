
import { useState, useCallback, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  startAfter,
  limit,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
  QueryConstraint,
  endBefore,
  limitToLast,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface PaginatedSortConfig<T> {
  key: keyof T;
  direction: 'ascending' | 'descending';
}

export const usePaginatedFirestore = <T extends { id: string }>(
  collectionPath: string,
  initialSortConfig: PaginatedSortConfig<T>,
  filters: QueryConstraint[] = [],
  pageSize = 15
) => {
  const [documents, setDocuments] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);

  const [sortConfig, setSortConfig] = useState(initialSortConfig);

  const loadData = useCallback(async (direction?: 'next' | 'prev') => {
    setLoading(true);
    setError(null);
    try {
      const qConstraints: QueryConstraint[] = [
        ...filters,
        orderBy(sortConfig.key as string, sortConfig.direction === 'ascending' ? 'asc' : 'desc'),
      ];

      if (direction === 'next' && lastVisible) {
        qConstraints.push(startAfter(lastVisible));
        qConstraints.push(limit(pageSize));
      } else if (direction === 'prev' && firstVisible) {
        qConstraints.push(endBefore(firstVisible));
        qConstraints.push(limitToLast(pageSize));
      } else {
        qConstraints.push(limit(pageSize));
      }

      const q = query(collection(db, collectionPath), ...qConstraints);
      const snapshot = await getDocs(q);

      const newDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));

      if (!snapshot.empty) {
        setFirstVisible(snapshot.docs[0]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setDocuments(newDocs);
      } else {
        // This case handles reaching the end or beginning
        if (direction === 'next') setLastVisible(null); // No more next pages
        if (direction === 'prev') setFirstVisible(null); // No more previous pages
        if (!direction) {
          setDocuments([]); // Initial load is empty
          setFirstVisible(null);
          setLastVisible(null);
        }
      }

    } catch (e: any) {
      console.error("Firestore pagination error: ", e);
      setError(e.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath, JSON.stringify(filters), sortConfig, pageSize, firstVisible, lastVisible]);


  useEffect(() => {
    // Reset pagination state and load initial data when sort or filters change
    setPage(1);
    setFirstVisible(null);
    setLastVisible(null);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortConfig, JSON.stringify(filters)]);

  const nextPage = () => {
    if (documents.length < pageSize) return; // Don't go next if current page isn't full
    setPage(p => p + 1);
    loadData('next');
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(p => p - 1);
      loadData('prev');
    }
  };

  const requestSort = (key: keyof T) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return {
    documents,
    loading,
    error,
    nextPage,
    prevPage,
    hasNextPage: documents.length === pageSize && lastVisible !== null,
    hasPrevPage: page > 1,
    requestSort,
    sortConfig,
  };
};
