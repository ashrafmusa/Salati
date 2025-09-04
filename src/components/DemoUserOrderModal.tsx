import React from 'react';

interface DemoUserOrderModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const DemoUserOrderModal: React.FC<DemoUserOrderModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">إنشاء حساب جديد</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          لإكمال طلبك، سيتم استخدام المعلومات التي أدخلتها (الاسم ورقم الهاتف) لإنشاء حساب دائم لك. هل توافق على المتابعة؟
        </p>
        <div className="flex justify-center space-x-4 space-x-reverse">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-secondary transition-colors"
          >
            أوافق وأكمل الطلب
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoUserOrderModal;
