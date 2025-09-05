import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import SubPageHeader from '../components/SubPageHeader';
import QuantitySelector from '../components/QuantitySelector';
import { TrashIcon, CartIcon } from '../assets/icons';
import { calculateItemAndExtrasTotal } from '../utils/helpers';

const CartScreen: React.FC = () => {
  const { state, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (user) {
        navigate('/checkout');
    } else {
        navigate('/login', { state: { from: '/cart' } });
    }
  };

  return (
    <div>
      <SubPageHeader title="سلة التسوق" backPath="/" />
      <div className="p-4 max-w-2xl mx-auto">
        {state.items.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="bg-primary/10 dark:bg-primary/20 p-8 rounded-full mb-6">
                <CartIcon className="w-24 h-24 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">سلتك فارغة!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">أضف بعض السلات الشهية لتبدأ رحلة التسوق الخاصة بك.</p>
            <Link to="/" className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-secondary transition-all duration-200 transform active:scale-95 shadow-lg hover:shadow-xl">
                اكتشف السلات
            </Link>
          </div>
        ) : (
          <div className="pb-32">
            <div className="space-y-4">
              {state.items.map(item => {
                const itemAndExtrasPrice = calculateItemAndExtrasTotal(item, item.selectedExtras);
                return (
                <div key={item.cartId} className="flex items-start bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
                  <img src={item.imageUrl} alt={item.name} className="w-24 h-24 rounded-lg object-cover ml-4" />
                  <div className="flex-grow space-y-1">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{item.arabicName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{itemAndExtrasPrice} ج.س / للقطعة</p>
                     {item.selectedExtras.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                          <p className="font-semibold">الإضافات:</p>
                          <ul className="list-disc list-inside mr-4">
                              {item.selectedExtras.map(extra => (
                                  <li key={extra.id}>{extra.name} (+{extra.price} ج.س)</li>
                              ))}
                          </ul>
                      </div>
                    )}
                     <p className="text-secondary dark:text-green-400 font-bold text-base pt-1">الإجمالي: {itemAndExtrasPrice * item.quantity} ج.س</p>
                  </div>
                  <div className="flex flex-col items-end space-y-3 flex-shrink-0">
                    <QuantitySelector
                      quantity={item.quantity}
                      onIncrease={() => updateQuantity(item.cartId, item.quantity + 1)}
                      onDecrease={() => updateQuantity(item.cartId, item.quantity - 1)}
                    />
                     <button onClick={() => removeFromCart(item.cartId)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 transition-transform transform active:scale-90">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
              )})}
            </div>

            <div className="fixed bottom-[76px] left-0 right-0 bg-white/80 dark:bg-gray-800/80 p-4 border-t dark:border-gray-700 shadow-inner backdrop-blur-sm md:bottom-0">
                <div className="max-w-2xl mx-auto">
                    <div className="flex justify-between text-lg font-bold mb-4">
                        <span className="text-gray-600 dark:text-gray-300">الإجمالي النهائي</span>
                        <span className="text-primary text-2xl">{getCartTotal()} ج.س</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        className="w-full bg-primary text-white font-bold py-3 rounded-lg text-lg hover:bg-secondary transition-all duration-200 transform active:scale-95 shadow-lg"
                    >
                        المتابعة للدفع
                    </button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartScreen;