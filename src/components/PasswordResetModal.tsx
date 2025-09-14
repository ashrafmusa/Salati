import React, { useState } from 'react';
import { SpinnerIcon, CheckCircleIcon, EmailIcon } from '../assets/icons';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: string) => Promise<void>;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose, onSend }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    try {
      await onSend(email);
      setSent(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setEmail('');
    setLoading(false);
    setSent(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-form-entry">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 text-center">
          {sent ? 'تم إرسال الرابط' : 'إعادة تعيين كلمة المرور'}
        </h2>

        {sent ? (
          <div className="text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-300">
              إذا كان هناك حساب مرتبط بالبريد الإلكتروني الذي أدخلته، فسيتم إرسال رابط لإعادة تعيين كلمة المرور إليه.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 w-full px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-secondary transition-colors"
            >
              حسناً
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            <p className="text-slate-600 dark:text-slate-300 mb-6 text-center">
              أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة مرورك.
            </p>
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            
            <div className="relative">
              <EmailIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                dir="ltr"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-white dark:bg-slate-700 p-3 pr-10 text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-4 space-x-reverse mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-secondary transition-colors w-40 flex justify-center items-center"
              >
                {loading ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : 'إرسال الرابط'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordResetModal;