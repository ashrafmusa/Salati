import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { Driver } from '../types';
import { PlusIcon } from '../assets/icons';
import DriverFormModal from '../components/DriverFormModal';

const AdminDriversScreen: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

    useEffect(() => {
        const unsubscribe = db.collection('drivers').onSnapshot(snapshot => {
            const fetchedDrivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
            setDrivers(fetchedDrivers);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenModal = (driver?: Driver) => {
        setEditingDriver(driver || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDriver(null);
    };

    const handleSaveDriver = async (driverToSave: Driver) => {
        const { id, ...driverData } = driverToSave;
        try {
            if (editingDriver) {
                await db.collection('drivers').doc(id).update(driverData);
            } else {
                await db.collection('drivers').add(driverData);
            }
        } catch (error) {
            console.error("Error saving driver:", error);
        }
        handleCloseModal();
    };

    const handleDeleteDriver = async (driverId: string) => {
        if (window.confirm("Are you sure you want to delete this driver?")) {
            try {
                await db.collection('drivers').doc(driverId).delete();
            } catch (error) {
                console.error("Error deleting driver:", error);
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">قائمة السائقين</h2>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center bg-admin-primary text-white px-4 py-2 rounded hover:bg-admin-primary-hover transition-all duration-200 transform active:scale-95">
                    <PlusIcon className="w-5 h-5 ml-2" />
                    إضافة سائق
                </button>
            </div>
            
            {loading ? <p>Loading...</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">اسم السائق</th>
                                <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">رقم الهاتف</th>
                                <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">الحالة</th>
                                <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map(driver => (
                                <tr key={driver.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3 font-medium text-gray-700 dark:text-gray-200">{driver.name}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300" dir="ltr">{driver.phone}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300">{driver.status}</td>
                                    <td className="p-3 space-x-4 space-x-reverse">
                                        <button 
                                            onClick={() => handleOpenModal(driver)} 
                                            className="text-admin-primary hover:underline text-sm font-semibold">
                                            تعديل
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteDriver(driver.id)} 
                                            className="text-red-500 hover:underline text-sm font-semibold">
                                            حذف
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && <DriverFormModal driver={editingDriver} onClose={handleCloseModal} onSave={handleSaveDriver} />}
        </div>
    );
};

export default AdminDriversScreen;