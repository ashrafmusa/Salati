import React from 'react';
// FIX: The `react-router-dom` components `useNavigate` and `Link` were not found on the namespace import. Changed to a direct import to resolve the errors.
import { useNavigate, Link } from "react-router-dom";
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import SubPageHeader from '../components/SubPageHeader';
import { CartIcon } from '../assets/icons';
import CartItemCard from '../components/CartItemCard';
import MetaTagManager from '../components/MetaTagManager';

const CartScreen: React.FC = () => {
  const { state, deliveryFee, getCartSubtotal, getDiscountDetails, getFinalTotal, getCartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const cartItemCount = getCartCount();

  const handleCheckout = () => {
    if (state.items.length > 0) {
      if (user) {
          navigate('/checkout');
      } else {
          navigate('/login', { state: { from: '/cart' } });
      }
    }
  };

  const subtotal = getCartSubtotal();
  const { amount: discountAmount } = getDiscountDetails();
  const total = getFinalTotal();

  const OrderSummary = () => (
    <>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>المجموع الفرعي</span>
            <span>{subtotal.toLocaleString()} ج.س</span>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>رسوم التوصيل</span>
            <span>{deliveryFee.toLocaleString()} ج.س</span>
        </div>
        {discountAmount > 0 && (
            <div className="flex justify-between font-semibold text-green-600 dark:text-green-400">
                <span>الخصم</span>
                <span>-{discountAmount.toLocaleString()} ج.س</span>
            </div>
        )}
      </div>
      <div className="flex justify-between text-lg font-bold border-t dark:border-slate-700 pt-2 mt-2">
          <span className="text-slate-800 dark:text-slate-100">الإجمالي النهائي</span>
          <span className="text-primary text-2xl">{total.toLocaleString()} ج.س</span>
      </div>
      <button
          onClick={handleCheckout}
          className="w-full bg-primary text-white font-bold py-2.5 sm:py-3 rounded-lg text-lg hover:bg-secondary transition-all duration-200 transform active:scale-95 shadow-lg mt-4"
      >
          المتابعة للدفع
      </button>
    </>
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <MetaTagManager title="عربة التسوق - سـلـتـي" />
      <SubPageHeader title="عربة التسوق" backPath="/" itemCount={cartItemCount} />
      <div className="p-4 max-w-7xl mx-auto">
        {state.items.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="bg-primary/10 dark:bg-primary/20 p-6 sm:p-8 rounded-full mb-6">
                <CartIcon className="w-16 h-16 sm:w-24 sm:h-24 text-primary" />
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">عربتك فارغة!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">أضف بعض المنتجات لتبدأ رحلة التسوق الخاصة بك.</p>
            <Link to="/" className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-secondary transition-all duration-200 transform active:scale-95 shadow-lg hover:shadow-xl">
                اكتشف المنتجات
            </Link>
          </div>
        ) : (
          <div className="pb-48 lg:pb-0">
             <div className="flex justify-end items-center mb-6">
                <Link to="/" className="text-sm font-semibold text-primary hover:underline">
                    متابعة التسوق &rarr;
                </Link>
            </div>
            <div className="lg:grid lg:grid-cols-3 lg:gap-8 items-start">
              {/* Item List (Left Column on Desktop) */}
              <div className="lg:col-span-2 space-y-4">
                {state.items.map(item => (
                  <CartItemCard key={item.cartId} item={item} />
                ))}
              </div>
              {/* Order Summary (Right Column on Desktop, hidden on mobile) */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="sticky top-24 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                  <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">ملخص الطلب</h2>
                  <div className="space-y-3">
                    <OrderSummary />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer (Mobile only) */}
            <div className="fixed bottom-[76px] left-0 right-0 bg-white/80 dark:bg-slate-900/80 p-4 border-t dark:border-slate-800 shadow-lg-up backdrop-blur-sm lg:hidden">
                <div className="max-w-3xl mx-auto space-y-3">
                  <OrderSummary />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartScreen;