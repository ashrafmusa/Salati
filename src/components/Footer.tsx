import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t dark:border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Logo imgClassName="w-16" textClassName="text-2xl" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              منصة تسوق متكاملة توفر كل ما تحتاجه من المنتجات الغذائية إلى
              العقارات، مع تجربة مستخدم مبسطة.
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                روابط سريعة
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    to="/"
                    className="text-base text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                  >
                    الرئيسية
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cart"
                    className="text-base text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                  >
                    عربة التسوق
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className="text-base text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                  >
                    حسابي
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                قانوني
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    to="/terms"
                    className="text-base text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                  >
                    الشروط والأحكام
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-base text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                  >
                    سياسة الخصوصية
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8 text-center">
          <p className="text-base text-slate-500 dark:text-slate-400">
            &copy; {currentYear} Salati™. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
