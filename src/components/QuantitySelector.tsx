import React from "react";
import { PlusIcon, MinusIcon } from "../assets/icons";

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  isIncreaseDisabled?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  isIncreaseDisabled,
}) => {
  return (
    <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-md">
      <button
        onClick={onDecrease}
        className="px-3 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-md"
      >
        <MinusIcon className="w-4 h-4" />
      </button>
      <span className="px-4 py-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        disabled={isIncreaseDisabled}
        className="px-3 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default QuantitySelector;
