import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// FIX: Corrected react-router-dom import to fix module resolution issue by using a namespace import and destructuring. This can resolve issues where named exports are not correctly recognized by the build tool.
import * as ReactRouterDOM from 'react-router-dom';
const { useParams, useNavigate } = ReactRouterDOM;
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import { Supplier, Item, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import { logAdminAction } from '../utils/auditLogger';
import { SpinnerIcon, TrashIcon } from '../assets/icons';
import { useClickOutside } from '../hooks/useClickOutside';

const AdminPurchaseOrderFormScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: adminUser } = useAuth();
    const { showToast } = useToast();

    const [po, setPo] = useState<Partial<PurchaseOrder>>({ status: PurchaseOrderStatus.Draft, items: [], totalCost: 0, createdDate: new Date().toISOString(), expectedDate: new Date().toISOString() });
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(dropdownRef, () => setIsDropdownOpen(false));


    useEffect(() => {
        const fetchData = async () => {
            try {
                const suppliersSnap = await db.collection('suppliers').get();
                setSuppliers(suppliersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));

                const itemsSnap = await db.collection('items').get();
                setAllItems(itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));

                if (id) {
                    const poDoc = await db.collection('purchaseOrders').doc(id).get();
                    if (poDoc.exists) {
                        setPo({ id, ...poDoc.data() } as PurchaseOrder);
                    } else {
                        showToast("Purchase Order not found.", 'error');
                        navigate('/purchase-orders');
                    }
                }
            } catch (error) {
                showToast("Failed to load necessary data.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate, showToast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === "supplierId") {
            const selectedSupplier = suppliers.find(s => s.id === value);
            setPo(prev => ({ ...prev, [name]: value, supplierName: selectedSupplier?.name }));
        } else {
            setPo(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleItemChange = (itemId: string, field: 'quantity' | 'costPrice', value: number) => {
        const newItems = po.items?.map(item => 
            item.itemId === itemId ? { ...item, [field]: value } : item
        );
        setPo(prev => ({ ...prev, items: newItems }));
    };

    const handleAddItem = (item: Item) => {
        const newItem: PurchaseOrderItem = {
            itemId: item.id,
            itemName: item.arabicName,
            quantity: 1,
            costPrice: item.costUSD,
        };
        setPo(prev => ({ ...prev, items: [...(prev.items || []), newItem]}));
        setSearchTerm('');
        setIsDropdownOpen(false);
    };

    const handleRemoveItem = (itemId: string) => {
        setPo(prev => ({ ...prev, items: prev.items?.filter(item => item.itemId !== itemId) }));
    };

    const totalCost = useMemo(() => {
        return po.items?.reduce((total, item) => total + (item.quantity * item.costPrice), 0) || 0;
    }, [po.items]);

    const handleSave = async (newStatus?: PurchaseOrderStatus) => {
        if (!po.supplierId || !po.items || po.items.length === 0) {
            showToast("Please select a supplier and add at least one item.", "error");
            return;
        }

        setIsSaving(true);
        const dataToSave = {
            ...po,
            totalCost,
            status: newStatus || po.status,
            supplierName: suppliers.find(s => s.id === po.supplierId)?.name || '',
            lastUpdatedAt: new Date().toISOString(),
            lastUpdatedBy: { id: adminUser?.uid, name: adminUser?.name },
        };
        
        try {
            if (id) {
                await db.collection('purchaseOrders').doc(id).update(dataToSave);
                showToast("Purchase Order updated successfully!", "success");
            } else {
                const newPoRef = db.collection('purchaseOrders').doc();
                await newPoRef.set({ ...dataToSave, id: newPoRef.id, createdDate: new Date().toISOString() });
                showToast("Purchase Order created successfully!", "success");
                navigate('/purchase-orders');
            }
            logAdminAction(adminUser, id ? "Updated PO" : "Created PO", `PO for ${dataToSave.supplierName}`);
        } catch (error) {
            showToast("Failed to save Purchase Order.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredItems = useMemo(() => {
        if (!searchTerm) return [];
        const currentItemIds = new Set(po.items?.map(i => i.itemId));
        return allItems.filter(item => 
            !currentItemIds.has(item.id) &&
            item.arabicName.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5);
    }, [searchTerm, allItems, po.items]);

    if (loading) return <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-10 h-10 animate-spin text-admin-primary" /></div>;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4">{id ? `تعديل أمر الشراء #${id.slice(0,7)}` : 'إنشاء أمر شراء جديد'}</h2>
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                {/* Supplier & Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border dark:border-slate-700 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium">المورد</label>
                        <select name="supplierId" value={po.supplierId || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md mt-1">
                            <option value="">اختر مورد</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">تاريخ الإنشاء</label>
                        <input type="date" name="createdDate" value={po.createdDate?.split('T')[0] || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">تاريخ التسليم المتوقع</label>
                        <input type="date" name="expectedDate" value={po.expectedDate?.split('T')[0] || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md mt-1" />
                    </div>
                </div>

                {/* Items Section */}
                <div>
                    <h3 className="text-lg font-bold">الأصناف</h3>
                    <div ref={dropdownRef} className="relative my-2">
                        <input 
                            type="text" 
                            placeholder="ابحث لإضافة صنف..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full p-2 border rounded-md" 
                        />
                         {isDropdownOpen && filteredItems.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                                {filteredItems.map(item => (
                                    <li key={item.id} onClick={() => handleAddItem(item)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer">{item.arabicName}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="mt-4 space-y-2">
                        {po.items?.map(item => (
                            <div key={item.itemId} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                <span className="col-span-4 font-semibold">{item.itemName}</span>
                                <div className="col-span-3">
                                    <label className="text-xs">الكمية</label>
                                    <input type="number" value={item.quantity} onChange={e => handleItemChange(item.itemId, 'quantity', Number(e.target.value))} className="w-full p-1 border rounded-md" />
                                </div>
                                <div className="col-span-3">
                                    <label className="text-xs">التكلفة (USD)</label>
                                    <input type="number" step="0.01" value={item.costPrice} onChange={e => handleItemChange(item.itemId, 'costPrice', Number(e.target.value))} className="w-full p-1 border rounded-md" />
                                </div>
                                <div className="col-span-2 text-right">
                                     <button type="button" onClick={() => handleRemoveItem(item.itemId)} className="text-red-500 p-2 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <span className="text-lg font-bold">التكلفة الإجمالية: </span>
                    <span className="text-2xl font-bold text-admin-primary">{totalCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/purchase-orders')} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md">إلغاء</button>
                    <button onClick={() => handleSave()} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md w-32">
                        {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin mx-auto"/> : 'حفظ كمسودة'}
                    </button>
                    <button onClick={() => handleSave(PurchaseOrderStatus.Sent)} disabled={isSaving} className="px-4 py-2 bg-admin-primary text-white rounded-md w-40">
                         {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin mx-auto"/> : 'حفظ وإرسال للمورد'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPurchaseOrderFormScreen;