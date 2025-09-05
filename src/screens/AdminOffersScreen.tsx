import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { PromotionalBanner } from '../types';
import { PlusIcon } from '../assets/icons';
import OfferFormModal from '../components/OfferFormModal';

const AdminOffersScreen: React.FC = () => {
    const [offers, setOffers] = useState<PromotionalBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<PromotionalBanner | null>(null);

    useEffect(() => {
        const unsubscribe = db.collection('promotionalBanners').onSnapshot(snapshot => {
            const fetchedOffers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromotionalBanner));
            setOffers(fetchedOffers);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenModal = (offer?: PromotionalBanner) => {
        setEditingOffer(offer || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOffer(null);
    };

    const handleSaveOffer = async (offerToSave: PromotionalBanner) => {
        const { id, ...offerData } = offerToSave;
        try {
            if (editingOffer) {
                // Update existing offer
                await db.collection('promotionalBanners').doc(id).update(offerData);
            } else {
                // Add new offer
                await db.collection('promotionalBanners').add(offerData);
            }
        } catch (error) {
            console.error("Error saving offer:", error);
        }
        handleCloseModal();
    };

    const handleDeleteOffer = async (offerId: string) => {
        if (window.confirm("Are you sure you want to delete this offer?")) {
            try {
                await db.collection('promotionalBanners').doc(offerId).delete();
            } catch (error) {
                console.error("Error deleting offer:", error);
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إدارة العروض الترويجية</h2>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center bg-admin-primary text-white px-4 py-2 rounded hover:bg-admin-primary-hover transition-all duration-200 transform active:scale-95">
                    <PlusIcon className="w-5 h-5 ml-2" />
                    إضافة عرض
                </button>
            </div>
            
            {loading ? <p>Loading...</p> : (
                <div className="space-y-4">
                    {offers.map(offer => (
                        <div key={offer.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col md:flex-row items-start gap-4">
                           <img src={offer.imageUrl} alt={offer.title} className="w-full md:w-48 h-32 md:h-auto rounded-md object-cover shadow-sm flex-shrink-0" />
                            <div className="flex-grow">
                                <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{offer.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    ينتهي في: {new Date(offer.expiryDate).toLocaleDateString('ar-EG')}
                                </p>
                            </div>
                            <div className="flex-shrink-0 flex md:flex-col justify-end md:justify-start gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <button onClick={() => handleOpenModal(offer)} className="w-full md:w-auto text-admin-primary bg-admin-primary/10 hover:bg-admin-primary/20 text-sm font-semibold px-4 py-2 rounded-md transition">تعديل</button>
                                <button onClick={() => handleDeleteOffer(offer.id)} className="w-full md:w-auto text-red-500 bg-red-500/10 hover:bg-red-500/20 text-sm font-semibold px-4 py-2 rounded-md transition">حذف</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && <OfferFormModal offer={editingOffer} onClose={handleCloseModal} onSave={handleSaveOffer} />}
        </div>
    );
};

export default AdminOffersScreen;