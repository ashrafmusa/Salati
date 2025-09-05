import React, { useState, useMemo, useEffect } from 'react';
import { Basket } from '../types';
import { db } from '../firebase/config';
import BasketCard from '../components/BasketCard';
import PromotionalBanner from '../components/PromotionalBanner';
import CategoryFilter from '../components/CategoryFilter';
import { SearchIcon } from '../assets/icons';
import SalatiLogo from '../components/Logo';

const HomeScreen: React.FC = () => {
    const [baskets, setBaskets] = useState<Basket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("الكل");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const unsubscribe = db.collection('baskets').onSnapshot(snapshot => {
            const basketsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Basket[];
            setBaskets(basketsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredBaskets = useMemo(() => {
        return baskets.filter(basket => {
            const matchesCategory = selectedCategory === "الكل" || basket.category === selectedCategory;
            const matchesSearch = (basket.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (basket.arabicName || '').includes(searchTerm);
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchTerm, baskets]);
    
    const renderContent = () => {
        if (loading) {
            return <p className="text-center text-gray-500 dark:text-gray-400 col-span-full mt-8">جاري تحميل السلات...</p>
        }
        if (filteredBaskets.length > 0) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBaskets.map(basket => (
                        <BasketCard key={basket.id} basket={basket} />
                    ))}
                </div>
            )
        }
        return <p className="text-center text-gray-500 dark:text-gray-400 col-span-full mt-8">لا توجد سلات تطابق بحثك.</p>
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex flex-col items-center mb-6">
                <SalatiLogo className="w-24 h-auto" />
                <p className="text-gray-500 dark:text-gray-400 mt-1">أفضل السلال الغذائية تصلك لباب بيتك.</p>
            </div>

            <div className="relative mb-6">
                <input
                    type="text"
                    placeholder="ابحث عن سلة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-transparent dark:border-gray-700/50 focus:ring-2 focus:ring-primary focus:border-primary dark:focus:border-primary focus:outline-none transition-shadow shadow-md focus:shadow-lg"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <SearchIcon className="w-6 h-6 text-gray-400" />
                </div>
            </div>

            <PromotionalBanner />
            <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} allBaskets={baskets} />

            {renderContent()}
        </div>
    );
};

export default HomeScreen;