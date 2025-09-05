import React from 'react';
import { AdminOrder, Driver, CartItem } from '../types';
// FIX: Import the correct helper function.
import { calculateItemAndExtrasTotal } from '../utils/helpers';

interface OrderDetailsModalProps {
  order: AdminOrder;
  onClose: () => void;
  drivers: Driver[];
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, drivers }) => {
    const driver = drivers.find(d => d.id === order.driverId);

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">تفاصيل الطلب #{order.id.slice(0, 7).toUpperCase()}</h2>
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">بتاريخ: {new Date(order.date).toLocaleDateString('ar-EG')}</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg text-slate-800 dark:text-slate-200">
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-100 mb-3">معلومات العميل</h3>
                <p><span className="font-semibold">الاسم:</span> {order.customer?.name || order.deliveryInfo.name}</p>
                <p><span className="font-semibold">الهاتف:</span> <span dir="ltr">{order.deliveryInfo.phone}</span></p>
                <p><span className="font-semibold">العنوان:</span> {order.customer?.address || order.deliveryInfo.address}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg text-slate-800 dark:text-slate-200">
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-100 mb-3">معلومات التوصيل</h3>
                <p><span className="font-semibold">الحالة:</span> {order.status}</p>
                <p><span className="font-semibold">السائق:</span> {driver ? driver.name : 'لم يتم التعيين'}</p>
            </div>
        </div>

        <div className="p-6">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-100 mb-3">محتويات الطلب</h3>
            <div className="overflow-x-auto border dark:border-slate-700 rounded-lg">
                <table className="w-full text-right">
                    <thead className="bg-slate-100 dark:bg-slate-700">
                        <tr >
                            <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">المنتج</th>
                            <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">الكمية</th>
                            <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">السعر</th>
                            <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map(item => (
                            <tr key={item.cartId} className="border-b dark:border-slate-700">
                                <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{item.arabicName}</td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                {/* FIX: Updated the function call to pass the entire item object. */}
                                <td className="p-3 text-slate-600 dark:text-slate-300">{calculateItemAndExtrasTotal(item)} ج.س</td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">{calculateItemAndExtrasTotal(item) * item.quantity} ج.س</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div className="p-6 border-t dark:border-slate-700 flex justify-end items-center sticky bottom-0 bg-white dark:bg-slate-800 z-10">
            <div className="text-right space-y-1">
                {order.subtotal !== undefined && (
                    <div className="text-slate-600 dark:text-slate-300 text-md">
                        <span>المجموع الفرعي:</span>
                        <span className="font-semibold mr-2">{order.subtotal.toFixed(2)} ج.س</span>
                    </div>
                )}
                {order.deliveryFee !== undefined && (
                    <div className="text-slate-600 dark:text-slate-300 text-md">
                        <span>رسوم التوصيل:</span>
                        <span className="font-semibold mr-2">{order.deliveryFee.toFixed(2)} ج.س</span>
                    </div>
                )}
                 <div className="text-slate-800 dark:text-slate-100">
                    <span className="text-lg">الإجمالي الكلي:</span>
                    <span className="text-3xl font-bold text-secondary mr-2">{order.total.toFixed(2)} ج.س</span>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;