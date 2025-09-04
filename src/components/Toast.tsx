import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../contexts/ToastContext';
import { CheckCircleIcon, WarningIcon, CloseIcon } from '../assets/icons';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

const toastConfig = {
  success: {
    icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
    barClass: 'bg-green-500',
  },
  error: {
    icon: <WarningIcon className="w-6 h-6 text-red-500" />,
    barClass: 'bg-red-500',
  },
  info: {
    icon: <WarningIcon className="w-6 h-6 text-blue-500" />,
    barClass: 'bg-blue-500',
  },
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const config = toastConfig[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      const exitTimer = setTimeout(() => onDismiss(toast.id), 500); // Wait for animation
      return () => clearTimeout(exitTimer);
    }, 5000); // 5 seconds duration

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 500);
  };

  return (
    <div
      className={`relative flex items-start w-80 max-w-sm p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border dark:border-slate-700 ${
        isExiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <div className="flex-shrink-0">{config.icon}</div>
      <div className="mr-3 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{toast.message}</p>
      </div>
      <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <CloseIcon className="w-5 h-5" />
      </button>
      <div
        className={`absolute bottom-0 left-0 h-1 ${config.barClass} animate-progress`}
      ></div>
    </div>
  );
};

export default Toast;
