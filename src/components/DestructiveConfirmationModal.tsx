import React, { useState } from 'react';
import { SpinnerIcon, ExclamationTriangleIcon } from '../assets/adminIcons';

interface DestructiveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText: string;
  confirmationPhrase: string;
  isProcessing: boolean;
}

const DestructiveConfirmationModal: React.FC<DestructiveConfirmationModalProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmText, confirmationPhrase, isProcessing
}) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const isConfirmed = inputValue === confirmationPhrase;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 text-center animate-form-entry">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4">{title}</h2>
        <div className="text-slate-600 dark:text-slate-300 my-4 text-sm text-right leading-relaxed">
          {message}
        </div>
        
        <div className="mt-6 text-right">
            <label htmlFor="confirmation-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                للتأكيد، يرجى كتابة "<span className="font-mono text-red-500">{confirmationPhrase}</span>" في الحقل أدناه:
            </label>
            <input
                id="confirmation-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="mt-2 w-full p-2 border rounded-md text-center font-mono border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-700"
                autoComplete="off"
            />
        </div>

        <div className="flex justify-center space-x-4 space-x-reverse mt-6">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed || isProcessing}
            className="px-6 py-2 text-white font-bold rounded-lg transition-colors bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-800 disabled:cursor-not-allowed w-36 flex justify-center"
          >
            {isProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestructiveConfirmationModal;
