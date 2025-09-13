import React, { useState, useEffect } from 'react';
// FIX: Replaced react-router-dom namespace import with named imports (useParams, Link) and removed the namespace prefix to resolve build errors.
import { useParams, Link } from 'react-router-dom';
import { WhatsAppIcon, CheckCircleIcon, SpinnerIcon } from '../assets/icons';
import { useAuth } from '../hooks/useAuth';
import { Order } from '../types';
// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import 'firebase/compat/firestore';
import { db } from '../firebase/config';

const SaveDetailsPrompt: React.FC<{ order: Order | null }> = ({ order }) => {
    const { user, updateUserDetails } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    if (!user || (user.address && user.name !== 'عميل جديد') || !order) {
        return null;
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateUserDetails({
                name: order.deliveryInfo.name,
                address: order.deliveryInfo.address,
                phone: order.deliveryInfo.phone,
            });
            setIsSaved(true);
        } catch (error) {
            console.error("Failed to save user details:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isSaved) {
        return (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/50 rounded-lg text-center">
                <p className="font-semibold text-green-700 dark:text-green-300 flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    تم حفظ معلوماتك بنجاح!
                </p>
            </div>
        );
    }
    
    return (
        <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-center">
            <p className="font-semibold text-slate-700 dark:text-slate-200">
                هل ترغب بحفظ هذه المعلومات لتسريع عملية الشراء في المرة القادمة؟
            </p>
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="mt-3 bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-secondary transition-colors w-32"
            >
                {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin mx-auto"/> : 'نعم، احفظ'}
            </button>
        </div>
    );
};


const OrderSuccessScreen: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);

    const phoneNumber = '96876702322'; // Company WhatsApp number
    const message = encodeURIComponent(`مرحباً سـلـتـي،\nأود تأكيد طلبي رقم: ${orderId?.slice(0, 7).toUpperCase()}`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    useEffect(() => {
        const fetchOrder = async () => {
            if (orderId) {
                // FIX: Refactored Firestore getDoc call to use v8 compat syntax.
                const orderRef = db.collection('orders').doc(orderId);
                const orderSnap = await orderRef.get();
                if (orderSnap.exists) {
                    setOrder({ id: orderSnap.id, ...orderSnap.data() } as Order);
                }
            }
        };
        fetchOrder();
    }, [orderId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-center p-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg max-w-md w-full space-y-6">
                <div>
                    <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">شكراً لك!</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">تم استلام طلبك بنجاح.</p>
                    
                    <div className="mt-8 bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-500 dark:text-slate-400">رقم طلبك هو:</p>
                        <p className="text-2xl font-bold text-primary tracking-wider">{orderId?.slice(0, 7).toUpperCase()}</p>
                    </div>

                    <div className="mt-6 text-slate-600 dark:text-slate-400 space-y-2">
                        <p>سنتصل بك قريباً لتأكيد تفاصيل التوصيل.</p>
                        <p className="font-semibold">سيتم توصيل طلبك في غضون 24-48 ساعة.</p>
                    </div>
                </div>
                
                <SaveDetailsPrompt order={order} />
                
                <div>
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex items-center justify-center w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors"
                    >
                        <WhatsAppIcon className="w-6 h-6 ml-3" />
                        تأكيد الطلب عبر واتساب
                    </a>

                    <Link
                        to="/"
                        className="mt-4 inline-block w-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        العودة إلى الرئيسية
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessScreen;