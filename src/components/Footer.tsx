import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import {
  EmailIcon,
  WhatsAppIcon,
  FacebookIcon,
  InstagramIcon,
} from "../assets/icons";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const phoneNumber = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER;
  const emailAddress = "salati.sudan@gmail.com";
  const whatsappUrl = `https://wa.me/${phoneNumber}`;

  return (
    <footer className="bg-white dark:bg-slate-900 border-t dark:border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo & Description */}
          <div className="space-y-4">
            <Logo
              imgProps={{ width: 64, height: 64 }}
              imgClassName="w-16"
              textClassName="text-2xl"
            />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              منصة تسوق متكاملة توفر كل ما تحتاجه من المنتجات الغذائية إلى
              العقارات، مع تجربة مستخدم مبسطة.
            </p>
          </div>

          {/* Column 2: Contact & Social */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              تواصل معنا
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`mailto:${emailAddress}`}
                  className="flex items-center gap-3 text-base text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  <EmailIcon className="w-5 h-5" />
                  <span>{emailAddress}</span>
                </a>
              </li>
              {phoneNumber && (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-base text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    <span dir="ltr">{phoneNumber}</span>
                  </a>
                </li>
              )}
            </ul>
            <div className="flex space-x-4 space-x-reverse mt-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-600 transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <FacebookIcon className="w-6 h-6" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-pink-500 transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <InstagramIcon className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              روابط سريعة
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/profile"
                  className="text-base text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                >
                  حسابي
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="text-base text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                >
                  طلباتي
                </Link>
              </li>
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

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              ابق على اطلاع
            </h3>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
              اشترك في نشرتنا الإخبارية للحصول على آخر التحديثات والعروض.
            </p>
            <form className="mt-4 sm:flex sm:max-w-md">
              <label htmlFor="email-address" className="sr-only">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email-address"
                id="email-address"
                autoComplete="email"
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white dark:bg-slate-800"
                placeholder="أدخل بريدك الإلكتروني"
              />
              <div className="mt-3 rounded-md sm:mt-0 sm:mr-3 sm:flex-shrink-0">
                <button
                  type="submit"
                  className="w-full bg-primary flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white hover:bg-secondary transition-colors"
                >
                  اشترك
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8 text-center">
          <p className="text-base text-slate-500 dark:text-slate-400">
            &copy; {currentYear} Salati™. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
