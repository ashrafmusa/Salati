import React from 'react';
import { WarningIcon } from '../assets/icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 text-center animate-form-entry">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${isDestructive ? 'bg-red-100 dark:bg-red-900/50' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
            <WarningIcon className={`h-6 w-6 ${isDestructive ? 'text-red-600 dark:text-red-300' : 'text-blue-600 dark:text-blue-300'}`} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4">{title}</h2>
        <p className="text-slate-600 dark:text-slate-300 my-4">
          {message}
        </p>
        <div className="flex justify-center space-x-4 space-x-reverse">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 text-white font-bold rounded-lg transition-colors ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-secondary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
