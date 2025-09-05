import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { WhatsAppIcon } from '../assets/icons';

const OrderSuccessScreen: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();

    const phoneNumber = '96876702322'; // Company WhatsApp number
    const message = encodeURIComponent(`مرحباً سـلـتـي،\nأود تأكيد طلبي رقم: ${orderId?.slice(0, 7).toUpperCase()}`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md w-full space-y-6">
                <div>
                    <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">شكراً لك!</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">تم استلام طلبك بنجاح.</p>
                    
                    <div className="mt-8 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">رقم طلبك هو:</p>
                        <p className="text-2xl font-bold text-primary tracking-wider">{orderId?.slice(0, 7).toUpperCase()}</p>
                    </div>

                    <div className="mt-6 text-gray-600 dark:text-gray-400 space-y-2">
                        <p>سنتصل بك قريباً لتأكيد تفاصيل التوصيل.</p>
                        <p className="font-semibold">سيتم توصيل طلبك في غضون 24-48 ساعة.</p>
                    </div>
                </div>
                
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
                        className="mt-4 inline-block w-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        العودة إلى الرئيسية
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessScreen;
