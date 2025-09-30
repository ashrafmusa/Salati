

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { UserList, StoreProduct, Item, Bundle, UserListItem } from '../types';
import SubPageHeader from '../components/SubPageHeader';
import { ClipboardListIcon, PlusIcon, SpinnerIcon, TrashIcon, PencilIcon, SearchIcon, CheckCircleIcon, CloseIcon } from '../assets/icons';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { getOptimizedImageUrl } from '../utils/helpers';
import { useClickOutside } from '../hooks/useClickOutside';
import { useNavigate } from 'react-router-dom';

// Modal for creating or editing a list name
const ListModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  listName?: string;
}> = ({ isOpen, onClose, onSave, listName = '' }) => {
  const [name, setName] = useState(listName);

  useEffect(() => {
    setName(listName);
  }, [listName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">إعادة تسمية القائمة</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: مشتريات الأسبوع"
          className="w-full p-2 border rounded-md"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md">إلغاء</button>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">حفظ</button>
        </div>
      </form>
    </div>
  );
};


const MyListsScreen: React.FC = () => {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [lists, setLists] = useState<UserList[]>([]);
    const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingList, setEditingList] = useState<UserList | null>(null);
    const [deletingList, setDeletingList] = useState<UserList | null>(null);
    
    const [addingListId, setAddingListId] = useState<string | null>(null);

    const userListsRef = useMemo(() => user ? db.collection('users').doc(user.uid).collection('lists') : null, [user]);

    useEffect(() => {
        if (!userListsRef) {
            setLoading(false);
            return;
        }

        const unsubscribe = userListsRef.orderBy('name').onSnapshot(snapshot => {
            setLists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserList)));
            setLoading(false);
        });

        const fetchProducts = async () => {
             const itemsSnap = await db.collection('items').get();
             const bundlesSnap = await db.collection('bundles').get();
             const items = itemsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'item' } as Item));
             const bundles = bundlesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'bundle' } as Bundle));
             setAllProducts([...items, ...bundles]);
        };

        fetchProducts();
        
        return () => unsubscribe();
    }, [userListsRef]);

    const handleSaveList = async (name: string) => {
        if (!userListsRef || !editingList) return;

        try {
            await userListsRef.doc(editingList.id).update({ name });
            showToast('تمت إعادة تسمية القائمة بنجاح', 'success');
        } catch (error) {
            showToast('حدث خطأ ما', 'error');
        } finally {
            setIsModalOpen(false);
            setEditingList(null);
        }
    };

    const handleDeleteList = async () => {
        if (!deletingList || !userListsRef) return;
        try {
            await userListsRef.doc(deletingList.id).delete();
            showToast('تم حذف القائمة', 'success');
        } catch (error) {
            showToast('فشل حذف القائمة', 'error');
        } finally {
            setDeletingList(null);
        }
    };

    const handleAddAllToCart = (list: UserList) => {
        setAddingListId(list.id);
        const productsToAdd = list.items
            .map(listItem => allProducts.find(p => p.id === listItem.productId))
            .filter((p): p is StoreProduct => p !== undefined && p.stock > 0);
        
        productsToAdd.forEach(p => addToCart(p, 1, []));
        
        setTimeout(() => {
            setAddingListId(null);
            showToast(`تمت إضافة ${productsToAdd.length} منتجًا إلى العربة`, 'success');
        }, 1000);
    };

    const handleRemoveItem = (listId: string, item: UserListItem) => {
        if(!userListsRef) return;
        userListsRef.doc(listId).update({
            items: firebase.firestore.FieldValue.arrayRemove(item)
        });
    };
    
    if (loading) {
        return <div><SubPageHeader title="قوائمي" /><div className="p-4 text-center">جارِ التحميل...</div></div>
    }
    
    return (
        <div>
            <SubPageHeader title="قوائمي" backPath="/profile" />

            <div className="max-w-4xl mx-auto p-4">
                <div className="flex justify-end mb-4">
                    <button onClick={() => navigate('/my-lists/new')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg">
                        <PlusIcon className="w-5 h-5" />
                        إنشاء قائمة جديدة
                    </button>
                </div>

                {lists.length === 0 ? (
                    <div className="text-center py-16">
                         <ClipboardListIcon className="w-24 h-24 text-slate-300 mx-auto" />
                         <h2 className="mt-4 text-xl font-bold">ليس لديك قوائم بعد</h2>
                         <p className="text-slate-500 mt-2">أنشئ قائمة لحفظ مجموعات المنتجات التي تشتريها بشكل متكرر.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {lists.map(list => {
                            const listItemsDetails = list.items
                                .map(li => ({
                                    ...li,
                                    product: allProducts.find(p => p.id === li.productId)
                                }))
                                .filter(item => item.product);

                            return (
                                <div key={list.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-lg">{list.name} ({list.items.length})</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => {setEditingList(list); setIsModalOpen(true);}}><PencilIcon className="w-5 h-5 text-slate-500"/></button>
                                            <button onClick={() => setDeletingList(list)}><TrashIcon className="w-5 h-5 text-slate-500"/></button>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {listItemsDetails.map(item => (
                                            <div key={item.productId} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <img src={getOptimizedImageUrl(item.product!.imageUrl, 100)} className="w-10 h-10 rounded object-cover" />
                                                    <span>{item.product!.arabicName}</span>
                                                </div>
                                                <button onClick={() => handleRemoveItem(list.id, { productId: item.productId, productType: item.productType })}><CloseIcon className="w-5 h-5 text-slate-400"/></button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-4 border-t dark:border-slate-700">
                                        <button 
                                            onClick={() => handleAddAllToCart(list)}
                                            disabled={addingListId === list.id || list.items.length === 0}
                                            className="w-full bg-primary/10 text-primary font-semibold py-2 rounded-md disabled:opacity-50 flex justify-center items-center"
                                        >
                                             {addingListId === list.id ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : 'إضافة الكل للعربة'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <ListModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveList} listName={editingList?.name} />
            
            <ConfirmationModal 
                isOpen={!!deletingList}
                onClose={() => setDeletingList(null)}
                onConfirm={handleDeleteList}
                title="حذف القائمة"
                message={`هل أنت متأكد من رغبتك في حذف قائمة "${deletingList?.name}"؟`}
                isDestructive
            />
        </div>
    );
};

export default MyListsScreen;