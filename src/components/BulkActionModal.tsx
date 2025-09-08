import React, { useState } from "react";
import { SpinnerIcon, CloseIcon } from "../assets/icons";

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string | number) => void;
  title: string;
  inputType: "select" | "number";
  options?: { value: string; label: string }[];
  label: string;
  confirmText?: string;
  isSaving: boolean;
}

const BulkActionModal: React.FC<BulkActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  inputType,
  options = [],
  label,
  confirmText = "تطبيق",
  isSaving,
}) => {
  const [value, setValue] = useState<string | number>("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (value !== "") {
      onConfirm(value);
    }
  };

  const inputClasses =
    "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-form-entry">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="my-6">
          <label
            htmlFor="bulk-value"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            {label}
          </label>
          {inputType === "number" ? (
            <input
              id="bulk-value"
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className={inputClasses}
            />
          ) : (
            <select
              id="bulk-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={inputClasses}
            >
              <option value="">اختر...</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-end space-x-4 space-x-reverse">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100 rounded-lg"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving || value === ""}
            className="px-6 py-2 text-white font-bold rounded-lg bg-admin-primary hover:bg-admin-primary-hover disabled:bg-slate-400 w-28 flex justify-center"
          >
            {isSaving ? (
              <SpinnerIcon className="w-5 h-5 animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionModal;
