import React from 'react';
import { User } from '../types';
import { CloseIcon, HeartIcon, SearchIcon } from '../assets/icons';

interface WelcomeModalProps {
  user: User;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ user, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 text-center animate-form-entry">
      <div className="flex justify-end">
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><CloseIcon className="w-6 h-6"/></button>
      </div>
      <h2 className="text-2xl font-bold text-primary mb-4">أهلاً بك، {user.name}!</h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        يسعدنا انضمامك إلى منصة سـلـتـي. إليك بعض النصائح لتبدأ:
      </p>
      <ul className="space-y-3 text-right">
        <li className="flex items-center gap-3"><div className="bg-primary/10 p-2 rounded-full"><SearchIcon className="w-5 h-5 text-primary"/></div><span>استخدم البحث للعثور على منتجاتك المفضلة بسرعة.</span></li>
        <li className="flex items-center gap-3"><div className="bg-primary/10 p-2 rounded-full"><HeartIcon className="w-5 h-5 text-primary"/></div><span>أضف المنتجات للمفضلة للوصول إليها لاحقاً.</span></li>
      </ul>
      <button
        onClick={onClose}
        className="mt-8 w-full px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-secondary transition-colors"
      >
        ابدأ التسوق
      </button>
    </div>
  </div>
);

export default WelcomeModal;
