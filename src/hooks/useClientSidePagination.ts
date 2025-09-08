import { useState, useMemo, useCallback, useEffect } from 'react';

export interface ClientSortConfig<T> {
  key: keyof T;
  direction: 'ascending' | 'descending';
}

export const useClientSidePagination = <T extends { id: string }>(
  fullData: T[],
  initialSortConfig: ClientSortConfig<T>,
  pageSize = 15
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState(initialSortConfig);

  const sortedData = useMemo(() => {
    const sortableItems = [...fullData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key;
        // Handle cases where properties might be undefined or null
        const valA = a[key] ?? (typeof a[key] === 'number' ? 0 : '');
        const valB = b[key] ?? (typeof b[key] === 'number' ? 0 : '');

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [fullData, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const requestSort = useCallback((key: keyof T) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort change
  }, [sortConfig]);

  // When the underlying data changes (e.g., due to filtering), reset to the first page.
  useEffect(() => {
    setCurrentPage(1);
  }, [fullData.length]);


  return {
    paginatedDocuments: paginatedData,
    requestSort,
    sortConfig,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  };
};
