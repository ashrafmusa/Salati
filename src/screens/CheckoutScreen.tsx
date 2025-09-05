import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import SubPageHeader from "../components/SubPageHeader";
import { Order, OrderStatus } from "../types";
import { db } from "../firebase/config";
import firebase from "firebase/compat/app";
// FIX: Import the correct helper function.
import {
  calculateItemAndExtrasTotal,
  getOptimizedImageUrl,
} from "../utils/helpers";
import { SpinnerIcon } from "../assets/icons";

const CheckoutScreen: React.FC = () => {
  const {
    state,
    deliveryFee,
    getCartSubtotal,
    getDiscountDetails,
    getFinalTotal,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    // Pre-fill form if user is logged in
    if (user) {
      setName(user.name);
      setAddress(user.address || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const subtotal = getCartSubtotal();
  const { amount: discountAmount, offerIds: appliedOfferIds } =
    getDiscountDetails();
  const total = getFinalTotal();

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
    setErrors({});

    try {
      const itemsRef = db.collection("items");
      const bundlesRef = db.collection("bundles");

      const newOrderId = await db.runTransaction(async (transaction) => {
        const itemsToUpdate: {
          ref: firebase.firestore.DocumentReference;
          newStock: number;
        }[] = [];

        for (const item of state.items) {
          // FIX: `item.id` does not exist on `CartItem`. Use `item.productId`.
          const productRef =
            item.productType === "item"
              ? itemsRef.doc(item.productId)
              : bundlesRef.doc(item.productId);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists) {
            throw new Error(`المنتج "${item.arabicName}" لم يعد متوفراً.`);
          }

          const currentStock = productDoc.data()?.stock ?? 0;
          if (currentStock < item.quantity) {
            throw new Error(
              `عذراً، الكمية المطلوبة من "${item.arabicName}" غير متوفرة في المخزون.`
            );
          }

          itemsToUpdate.push({
            ref: productRef,
            newStock: currentStock - item.quantity,
          });
        }

        itemsToUpdate.forEach((itemUpdate) => {
          transaction.update(itemUpdate.ref, { stock: itemUpdate.newStock });
        });

        const newOrderRef = db.collection("orders").doc();
        const newOrderData: Omit<Order, "id"> = {
          userId: user.uid,
          date: new Date().toISOString(),
          items: state.items,
          subtotal,
          deliveryFee,
          total,
          discountAmount,
          appliedOfferIds,
          status: OrderStatus.Preparing,
          paymentStatus: "unpaid",
          deliveryInfo: { name, phone, address },
        };
        transaction.set(newOrderRef, newOrderData);

        return newOrderRef.id;
      });

      if (!newOrderId) {
        throw new Error("Failed to create order. Please try again.");
      }

      await db.collection("notifications").add({
        message: `طلب جديد #${newOrderId
          .slice(0, 7)
          .toUpperCase()} من ${name}.`,
        timestamp: new Date().toISOString(),
        read: false,
        link: `/orders`,
      });

      clearCart();
      navigate(`/order-success/${newOrderId}`);
    } catch (error: any) {
      console.error("Error placing order: ", error);
      setErrors({
        api: error.message || "لا يمكن إكمال الطلب. الرجاء المحاولة مرة أخرى.",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  useEffect(() => {
    if (state.items.length === 0 && !isPlacingOrder) {
      navigate("/");
    }
  }, [state.items, navigate, isPlacingOrder]);

  const inputClasses =
    "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";
  const errorBorder = "border-red-500";
  const normalBorder = "border-slate-300 dark:border-slate-600";

  return (
    <div>
      <SubPageHeader title="الدفع" backPath="/cart" />

      <form
        onSubmit={handlePlaceOrder}
        className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-32"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
          {/* Left Column: Form */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                معلومات التوصيل
              </h2>
              {errors.api && (
                <p className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/30 p-3 rounded-md">
                  {errors.api}
                </p>
              )}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputClasses} ${
                    errors.name ? errorBorder : normalBorder
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              <div className="mt-4">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  رقم هاتف للتواصل
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  placeholder="+249XXXXXXXXX"
                  className={`${inputClasses} ${
                    errors.phone ? errorBorder : normalBorder
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
              <div className="mt-4">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  العنوان بالتفصيل
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className={`${inputClasses} ${
                    errors.address ? errorBorder : normalBorder
                  }`}
                ></textarea>
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                طريقة الدفع
              </h2>
              <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/50 rounded-md text-center">
                <p className="font-semibold text-green-800 dark:text-green-300">
                  الدفع نقداً عند الاستلام
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm sticky top-20">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                ملخص الطلب
              </h2>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {state.items.map((item) => (
                  <div key={item.cartId} className="flex items-start gap-4">
                    <img
                      src={getOptimizedImageUrl(item.imageUrl, 150)}
                      alt={item.arabicName}
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.arabicName}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        الكمية: {item.quantity}
                      </p>
                    </div>
                    {/* FIX: Updated the function call to pass the entire item object. */}
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      {calculateItemAndExtrasTotal(item) * item.quantity} ج.س
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t dark:border-slate-700 space-y-2">
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
                <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-slate-50 pt-2 mt-2 border-t dark:border-slate-600">
                  <span>الإجمالي</span>
                  <span>{total.toLocaleString()} ج.س</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 p-4 border-t dark:border-slate-700 shadow-inner backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-center max-w-6xl mx-auto gap-3 sm:gap-4">
            <div className="w-full sm:w-auto text-center sm:text-left">
              <span className="text-slate-600 dark:text-slate-300 block text-sm sm:text-base">
                الإجمالي
              </span>
              <span className="text-2xl font-bold text-secondary">
                {total.toLocaleString()} ج.س
              </span>
            </div>
            <button
              type="submit"
              disabled={isPlacingOrder}
              className="w-full sm:w-48 px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-lg transition-all duration-200 transform active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed shadow-lg flex justify-center items-center"
            >
              {isPlacingOrder ? (
                <SpinnerIcon className="w-6 h-6 animate-spin" />
              ) : (
                "تأكيد الطلب"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutScreen;
