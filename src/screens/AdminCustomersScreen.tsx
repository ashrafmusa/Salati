import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { User } from '../types';
import { useAuth } from '../hooks/useAuth';

const AdminCustomersScreen: React.FC = () => {
    const { user: adminUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = db.collection('users')
            .onSnapshot(snapshot => {
                const fetchedUsers = snapshot.docs.map(doc => doc.data() as User);
                setUsers(fetchedUsers);
                setLoading(false);
            }, err => {
                console.error("Error fetching users: ", err);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (uid: string, newRole: 'admin' | 'customer') => {
        if (uid === adminUser?.uid) {
            alert("For security, you cannot change your own role.");
            return;
        }
        try {
            await db.collection('users').doc(uid).update({ role: newRole });
        } catch (error) {
            console.error("Error updating user role:", error);
            alert("Failed to update user role.");
        }
    };

    const handleDeleteUser = async (uid: string, name: string) => {
        if (uid === adminUser?.uid) {
            alert("For security, you cannot delete your own account.");
            return;
        }
        if (window.confirm(`Are you sure you want to delete the user "${name}"? This action is permanent and cannot be undone.`)) {
            try {
                await db.collection('users').doc(uid).delete();
                // Note: This only deletes the Firestore user document.
                // The Firebase Auth user record still exists. For a full deletion,
                // a Cloud Function would be required to interact with the Auth admin SDK.
            } catch (error) {
                console.error("Error deleting user:", error);
                alert("Failed to delete user.");
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">إدارة المستخدمين</h2>
            
            {loading ? <p>Loading users...</p> : (
            <>
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">المستخدم</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">رقم الهاتف / الإيميل</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.uid} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-3 text-gray-800 dark:text-gray-100 font-medium">{user.name}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300" dir="ltr">{user.phone || user.email}</td>
                                <td className="p-3">
                                     <div className="flex items-center gap-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.uid, e.target.value as 'admin' | 'customer')}
                                            disabled={user.uid === adminUser?.uid}
                                            className={`p-1 w-32 rounded text-sm border-gray-300 dark:border-gray-600 focus:ring-admin-primary focus:border-admin-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <option value="customer">Customer</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <button
                                            onClick={() => handleDeleteUser(user.uid, user.name)}
                                            disabled={user.uid === adminUser?.uid}
                                            className="text-red-500 hover:underline text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            حذف
                                        </button>
                                     </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            </>
            )}
        </div>
    );
};

export default AdminCustomersScreen;