import React, { useState, useEffect, useRef } from 'react';
// FIX: Switched to a namespace import for react-router-dom to fix module resolution errors in the build environment.
import * as ReactRouterDOM from "react-router-dom";
import { BellIcon } from '../assets/adminIcons';
import { db } from '../firebase/config';
// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { AdminNotification } from '../types';

const AdminNotifications: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = ReactRouterDOM.useNavigate();

    useEffect(() => {
        // FIX: Refactored Firestore query to use v8 compat syntax.
        const notificationsQuery = db.collection('notifications').orderBy('timestamp', 'desc').limit(10);
        // FIX: Explicitly typed the snapshot parameter as QuerySnapshot to resolve the "'docs' does not exist" error.
        const unsubscribe = notificationsQuery.onSnapshot((snapshot: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>) => {
            const allNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as AdminNotification));
            setNotifications(allNotifs);
            setUnreadCount(allNotifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, []);

    const toggleDropdown = () => setIsOpen(prev => !prev);

    const handleNotificationClick = async (notification: AdminNotification) => {
        if (!notification.read) {
            // FIX: Refactored Firestore updateDoc call to use v8 compat syntax.
            await db.collection('notifications').doc(notification.id).update({ read: true });
        }
        if (notification.link) {
            navigate(notification.link);
        }
        setIsOpen(false);
    };

    const handleMarkAllAsRead = async () => {
        const unreadNotifs = notifications.filter(n => !n.read);
        if (unreadNotifs.length === 0) return;

        // FIX: Refactored writeBatch call to use v8 compat syntax.
        const batch = db.batch();
        unreadNotifs.forEach(notification => {
            const notifRef = db.collection('notifications').doc(notification.id);
            batch.update(notifRef, { read: true });
        });

        await batch.commit();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={toggleDropdown} className="relative text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl z-50 overflow-hidden border dark:border-slate-700">
                    <div className="p-3 font-bold border-b dark:border-slate-700 text-slate-700 dark:text-slate-200 flex justify-between items-center">
                        <span>الإشعارات</span>
                        {unreadCount > 0 && <button onClick={handleMarkAllAsRead} className="text-xs text-admin-primary hover:underline font-semibold">تحديد الكل كمقروء</button>}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full flex items-start p-3 text-sm text-right hover:bg-slate-100 dark:hover:bg-slate-700 ${!notification.read ? 'bg-blue-50 dark:bg-sky-900/30' : ''}`}
                                >
                                    {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 ml-3 flex-shrink-0"></div>}
                                    <div className={notification.read ? "ml-5" : ""}>
                                        <p className="text-slate-800 dark:text-slate-100">{notification.message}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(notification.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="text-center text-slate-500 dark:text-slate-400 p-4">لا توجد إشعارات جديدة.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminNotifications;