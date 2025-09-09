
import { useState, useCallback, useEffect } from 'react';
// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from '../firebase/config';

export interface PaginatedSortConfig<T> {
  key: keyof T;
  direction: 'ascending' | 'descending';
}

// FIX: Refactored types to use v8 compat library.
type DocumentData = firebase.firestore.DocumentData;
type QueryDocumentSnapshot = firebase.firestore.QueryDocumentSnapshot<DocumentData>;
type WhereFilterOp = firebase.firestore.WhereFilterOp;


export const usePaginatedFirestore = <T extends { id: string }>(
  collectionPath: string,
  initialSortConfig: PaginatedSortConfig<T>,
  filters: [string, WhereFilterOp, any][] = [],
  pageSize = 15
) => {
  const [documents, setDocuments] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [page, setPage] = useState(1);
  
  const [sortConfig, setSortConfig] = useState(initialSortConfig);

  const loadData = useCallback(async (direction?: 'next' | 'prev') => {
    setLoading(true);
    setError(null);
    try {
      // FIX: Refactored query building to use v8 compat syntax.
      let q: firebase.firestore.Query = db.collection(collectionPath);

      filters.forEach(([field, op, value]) => {
        q = q.where(field, op, value);
      });

      q = q.orderBy(sortConfig.key as string, sortConfig.direction === 'ascending' ? 'asc' : 'desc');
      
      if (direction === 'next' && lastVisible) {
        q = q.startAfter(lastVisible);
      } else if (direction === 'prev' && firstVisible) {
        q = q.endBefore(firstVisible);
        q = q.limitToLast(pageSize); // limitToLast needs endBefore
      }

      if (direction !== 'prev') {
          q = q.limit(pageSize);
      }

      const snapshot = await q.get();
      
      const newDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));

      if (!snapshot.empty) {
        setFirstVisible(snapshot.docs[0]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setDocuments(newDocs);
      } else {
        if(direction === 'next') setLastVisible(null);
        if(direction === 'prev') setFirstVisible(null);
        if(!direction) {
          setDocuments([]);
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
    setPage(1);
    setFirstVisible(null);
    setLastVisible(null);
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortConfig, JSON.stringify(filters)]); 

  const nextPage = () => {
      if (documents.length < pageSize) return;
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
