import React from "react";
// FIX: The 'useSortableData.ts' file is not a module.
// The correct type definition is in 'usePaginatedFirestore.ts'.
import { PaginatedSortConfig as SortConfig } from "../hooks/usePaginatedFirestore";
import { ChevronUpIcon, ChevronDownIcon } from "../assets/adminIcons";

interface SortableHeaderProps<T> {
  label: string;
  sortKey: keyof T;
  requestSort: (key: keyof T) => void;
  sortConfig: SortConfig<T> | null;
  className?: string;
}

const SortableHeader = <T extends object>({
  label,
  sortKey,
  requestSort,
  sortConfig,
  className = "p-3 text-sm font-semibold text-slate-500 dark:text-slate-400",
}: SortableHeaderProps<T>) => {
  const isSorted = sortConfig?.key === sortKey;

  const DirectionIcon = () => {
    if (isSorted) {
      return sortConfig.direction === "ascending" ? (
        <ChevronUpIcon className="w-4 h-4" />
      ) : (
        <ChevronDownIcon className="w-4 h-4" />
      );
    }
    return (
      <div className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity">
        <ChevronUpIcon />
      </div>
    );
  };

  return (
    <th className={className}>
      <button
        onClick={() => requestSort(sortKey)}
        className="group flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <span>{label}</span>
        <DirectionIcon />
      </button>
    </th>
  );
};

export default SortableHeader;
