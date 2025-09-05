import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import SubPageHeader from '../components/SubPageHeader';
import { Order, OrderStatus } from '../types';
import { db } from '../firebase/config';
import { calculateItemAndExtrasTotal } from '../utils/helpers';

const DELIVERY_FEE = 500;

const CheckoutScreen: React.FC = () => {
  const { state, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    // Pre-fill form if user is logged in
    if (user) {
      setName(user.name);
      setAddress(user.address || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const subtotal = getCartTotal();
  const total = subtotal + DELIVERY_FEE;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "الاسم مطلوب";
    if (!phone.trim()) {
        newErrors.phone = "رقم الهاتف مطلوب";
    } else if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
        newErrors.phone = "رقم الهاتف غير صالح. يجب أن يبدأ بالرمز الدولي.";
    }
    if (!address.trim()) newErrors.address = "العنوان مطلوب";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isPlacingOrder || !validateForm()) {
      return;
    }
    setIsPlacingOrder(true);
    
    try {
        const newOrderData = {
            userId: user.uid,
            date: new Date().toISOString(),
            items: state.items,
            subtotal,
            deliveryFee: DELIVERY_FEE,
            total,
            status: OrderStatus.Preparing,
            deliveryInfo: { name, phone, address },
            customer: {
              name: user.name,
              phone: user.phone
            }
        };

        const ordersCollectionRef = db.collection('orders');
        const docRef = await ordersCollectionRef.add(newOrderData);

        // Create a notification for the admin
        await db.collection('notifications').add({
            message: `طلب جديد #${docRef.id.slice(0, 7).toUpperCase()} من ${name}.`,
            timestamp: new Date().toISOString(),
            read: false,
            link: `/orders`
        });

        clearCart();
        navigate(`/order-success/${docRef.id}`);

    } catch (error) {
        console.error("Error placing order: ", error);
        setErrors({ api: "Could not place order. Please try again." });
    } finally {
        setIsPlacingOrder(false);
    }
  };

  useEffect(() => {
    if (state.items.length === 0 && !isPlacingOrder) {
      navigate('/');
    }
  }, [state.items, navigate, isPlacingOrder]);

  const inputClasses = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";
  const errorBorder = "border-red-500";
  const normalBorder = "border-gray-300 dark:border-gray-600";

  return (
    <div>
      <SubPageHeader title="الدفع" backPath="/cart" />

      <form onSubmit={handlePlaceOrder} className="max-w-6xl mx-auto p-4 lg:p-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
          {/* Left Column: Form */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">معلومات التوصيل</h2>
              {errors.api && <p className="text-red-500 text-sm mb-4">{errors.api}</p>}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الكامل</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClasses} ${errors.name ? errorBorder : normalBorder}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="mt-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم هاتف للتواصل</label>
                <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="+249XXXXXXXXX" className={`${inputClasses} ${errors.phone ? errorBorder : normalBorder}`} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div className="mt-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">العنوان بالتفصيل</label>
                <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className={`${inputClasses} ${errors.address ? errorBorder : normalBorder}`}></textarea>
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">طريقة الدفع</h2>
              <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/50 rounded-md text-center">
                <p className="font-semibold text-green-800 dark:text-green-300">الدفع نقداً عند الاستلام</p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm sticky top-20">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">ملخص الطلب</h2>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {state.items.map(item => (
                  <div key={item.cartId} className="flex items-start gap-4">
                    <img src={item.imageUrl} alt={item.arabicName} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{item.arabicName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">الكمية: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-700 dark:text-gray-200">{calculateItemAndExtrasTotal(item, item.selectedExtras) * item.quantity} ج.س</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t dark:border-gray-700 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>المجموع الفرعي</span>
                  <span>{subtotal} ج.س</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>رسوم التوصيل</span>
                  <span>{DELIVERY_FEE} ج.س</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-gray-50 pt-2 mt-2 border-t dark:border-gray-600">
                  <span>الإجمالي</span>
                  <span>{total} ج.س</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 p-4 border-t dark:border-gray-700 shadow-inner backdrop-blur-sm">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div>
              <span className="text-gray-600 dark:text-gray-300 block">الإجمالي</span>
              <span className="text-2xl font-bold text-secondary">{total} ج.س</span>
            </div>
            <button type="submit" disabled={isPlacingOrder} className="w-48 px-6 py-3 rounded-lg bg-primary text-white font-bold text-lg hover:bg-secondary transition-all duration-200 transform active:scale-95 disabled:bg-gray-400 shadow-lg">
              {isPlacingOrder ? 'جارِ التأكيد...' : 'تأكيد الطلب'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutScreen;