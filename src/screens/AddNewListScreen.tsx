import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { useAuth } from '../hooks/useAuth';
import { UserListItem, StoreProduct, Item, Bundle } from '../types';
import SubPageHeader from '../components/SubPageHeader';
import { SearchIcon, PlusIcon, TrashIcon, SpinnerIcon } from '../assets/icons';
import { useToast } from '../contexts/ToastContext';
import { getOptimizedImageUrl } from '../utils/helpers';

const AddNewListScreen: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [listName, setListName] = useState('');
    const [listItems, setListItems] = useState<UserListItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);

    const userListsRef = useMemo(() => user ? db.collection('users').doc(user.uid).collection('lists') : null, [user]);

    useEffect(() => {
        const fetchProducts = async () => {
            setProductsLoading(true);
            const itemsSnap = await db.collection('items').get();
            const bundlesSnap = await db.collection('bundles').get();
            const items = itemsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'item' } as Item));
            const bundles = bundlesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'bundle' } as Bundle));
            setAllProducts([...items, ...bundles]);
            setProductsLoading(false);
        };

        fetchProducts();
    }, []);

    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const lowercasedTerm = searchTerm.toLowerCase();
        const currentItemIds = new Set(listItems.map(item => item.productId));
        return allProducts
            .filter(p => p.arabicName.toLowerCase().includes(lowercasedTerm) && !currentItemIds.has(p.id))
            .slice(0, 10); // Limit results
    }, [searchTerm, allProducts, listItems]);

    const listItemsDetails = useMemo(() => {
        return listItems
            .map(li => ({
                ...li,
                product: allProducts.find(p => p.id === li.productId)
            }))
            .filter((item): item is UserListItem & { product: StoreProduct } => !!item.product);
    }, [listItems, allProducts]);

    const handleAddItem = (product: StoreProduct) => {
        const newItem: UserListItem = {
            productId: product.id,
            productType: product.type
        };
        setListItems(prev => [...prev, newItem]);
    };
    
    const handleRemoveItem = (productId: string) => {
        setListItems(prev => prev.filter(item => item.productId !== productId));
    };

    const handleSaveList = async () => {
        if (!listName.trim()) {
            showToast('الرجاء إدخال اسم للقائمة', 'error');
            return;
        }
        if (listItems.length === 0) {
            showToast('الرجاء إضافة منتجات للقائمة أولاً', 'error');
            return;
        }
        if (!userListsRef) return;

        setIsSaving(true);
        try {
            await userListsRef.add({ name: listName, items: listItems });
            showToast('تم إنشاء القائمة بنجاح', 'success');
            navigate('/my-lists');
        } catch (error) {
            showToast('حدث خطأ أثناء حفظ القائمة', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <SubPageHeader title="إنشاء قائمة جديدة" backPath="/my-lists" />
            <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
                {/* List Name Input */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <label htmlFor="listName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">اسم القائمة</label>
                    <input
                        id="listName"
                        type="text"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        placeholder="مثال: مشتريات الأسبوع"
                        className="mt-1 w-full p-2 border rounded-md bg-white dark:bg-slate-700"
                    />
                </div>

                {/* Add Products Section */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold mb-2">إضافة منتجات للقائمة</h3>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ابحث عن منتج..."
                            className="w-full p-2 pl-10 border rounded-md bg-white dark:bg-slate-700"
                        />
                        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                    {searchTerm && (
                        <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                            {productsLoading ? (
                                <p className="text-center text-slate-500 py-4">جارِ تحميل المنتجات...</p>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(product => (
                                    <div key={product.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                                        <div className="flex items-center gap-2">
                                            <img src={getOptimizedImageUrl(product.imageUrl, 100)} className="w-10 h-10 rounded object-cover" alt={product.arabicName} />
                                            <span>{product.arabicName}</span>
                                        </div>
                                        <button onClick={() => handleAddItem(product)} className="p-2 bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-colors">
                                            <PlusIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-500 py-4">لا توجد نتائج</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Current List Items */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold mb-2">المنتجات في القائمة ({listItems.length})</h3>
                    <div className="space-y-2">
                        {listItemsDetails.length > 0 ? (
                            listItemsDetails.map(item => (
                                <div key={item.productId} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                                    <div className="flex items-center gap-2">
                                        <img src={getOptimizedImageUrl(item.product.imageUrl, 100)} className="w-10 h-10 rounded object-cover" alt={item.product.arabicName}/>
                                        <span>{item.product.arabicName}</span>
                                    </div>
                                    <button onClick={() => handleRemoveItem(item.productId)} className="p-2 bg-red-100/50 rounded-full text-red-500 hover:bg-red-100/80 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-500 py-4">لم تقم بإضافة أي منتجات بعد.</p>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="fixed bottom-[76px] md:bottom-auto md:relative md:flex md:justify-end left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none border-t border-slate-200 dark:border-slate-800 md:border-none md:p-0">
                    <button 
                        onClick={handleSaveList} 
                        disabled={isSaving}
                        className="px-6 py-3 bg-primary text-white font-bold rounded-lg w-full sm:w-auto flex justify-center items-center shadow-lg md:shadow-none"
                    >
                        {isSaving ? <SpinnerIcon className="w-6 h-6 animate-spin"/> : 'حفظ القائمة'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewListScreen;
