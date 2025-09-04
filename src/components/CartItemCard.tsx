import React from 'react';
import { CartItem } from '../types';
import { useCart } from '../hooks/useCart';
import QuantitySelector from './QuantitySelector';
import { TrashIcon } from '../assets/icons';
import { getOptimizedImageUrl, calculateItemAndExtrasTotal } from '../utils/helpers';

interface CartItemCardProps {
  item: CartItem;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCart();
  const itemAndExtrasPrice = calculateItemAndExtrasTotal(item, item.selectedExtras);
  const totalItemPrice = itemAndExtrasPrice * item.quantity;

  return (
    <div className="flex items-start bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 gap-4">
      <img
        src={getOptimizedImageUrl(item.imageUrl, 200)}
        alt={item.arabicName}
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg object-cover flex-shrink-0"
        loading="lazy"
      />
      <div className="flex-grow space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.arabicName}</h3>
            {item.selectedExtras.length > 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <ul className="list-disc list-inside mr-4">
                  {item.selectedExtras.map(extra => (
                    <li key={extra.id}>{extra.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button onClick={() => removeFromCart(item.cartId)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-transform transform active:scale-90 flex-shrink-0">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-2">
          <QuantitySelector
            quantity={item.quantity}
            onIncrease={() => updateQuantity(item.cartId, item.quantity + 1)}
            onDecrease={() => updateQuantity(item.cartId, item.quantity - 1)}
          />
          <p className="font-bold text-lg text-secondary dark:text-green-400">
            {totalItemPrice.toLocaleString()} ج.س
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;